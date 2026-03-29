// src/stores/useNotificationStore.ts
// CREATYNG — Notification system store (Zustand + localStorage + Supabase)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'credit' | 'promo' | 'update' | 'billing';
export type NotificationSource = 'system' | 'admin' | 'billing';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  source: NotificationSource;
  pinned?: boolean;
  supabaseId?: string; // maps to user_notifications.id
}

interface NotificationStore {
  notifications: Notification[];
  _realtimeChannel: ReturnType<typeof supabase.channel> | null;

  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;

  /** Fetch user_notifications from Supabase and merge into state */
  fetchFromSupabase: () => Promise<void>;

  /** Subscribe to realtime INSERTs on user_notifications for the current user */
  subscribeRealtime: (userId: string) => void;

  /** Unsubscribe from realtime */
  unsubscribeRealtime: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      _realtimeChannel: null,

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50),
        })),

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
        // Fire-and-forget Supabase update
        const notif = get().notifications.find((n) => n.id === id);
        if (notif?.supabaseId) {
          supabase
            .from('user_notifications')
            .update({ read: true })
            .eq('id', notif.supabaseId)
            .then(() => {})
            .catch(() => {});
        }
      },

      markAllAsRead: () => {
        const unreadIds = get().notifications.filter((n) => !n.read && n.supabaseId).map((n) => n.supabaseId!);
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        // Fire-and-forget Supabase bulk update
        if (unreadIds.length > 0) {
          supabase
            .from('user_notifications')
            .update({ read: true })
            .in('id', unreadIds)
            .then(() => {})
            .catch(() => {});
        }
      },

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      fetchFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);

          if (error || !data) return;

          const existing = get().notifications;
          const existingSupabaseIds = new Set(existing.filter((n) => n.supabaseId).map((n) => n.supabaseId));

          const newFromSupabase: Notification[] = data
            .filter((row) => !existingSupabaseIds.has(row.id))
            .map((row) => ({
              id: `sb-${row.id}`,
              supabaseId: row.id,
              type: (row.type || 'info') as NotificationType,
              title: row.title,
              message: row.message,
              read: row.read,
              createdAt: row.created_at,
              source: (row.source || 'admin') as NotificationSource,
              pinned: row.pinned,
            }));

          if (newFromSupabase.length > 0) {
            // Merge: pinned first, then by date
            const merged = [...newFromSupabase, ...existing]
              .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .slice(0, 50);
            set({ notifications: merged });
          }
        } catch (e) {
          console.warn('[NotificationStore] fetchFromSupabase failed:', e);
        }
      },

      subscribeRealtime: (userId: string) => {
        const existing = get()._realtimeChannel;
        if (existing) {
          supabase.removeChannel(existing);
        }

        const channel = supabase
          .channel('user-notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                type: string;
                title: string;
                message: string;
                read: boolean;
                pinned: boolean;
                source: string;
                created_at: string;
              };
              if (!row) return;

              const notif: Notification = {
                id: `sb-${row.id}`,
                supabaseId: row.id,
                type: (row.type || 'info') as NotificationType,
                title: row.title,
                message: row.message,
                read: false,
                createdAt: row.created_at,
                source: (row.source || 'admin') as NotificationSource,
                pinned: row.pinned,
              };

              set((state) => ({
                notifications: [notif, ...state.notifications].slice(0, 50),
              }));
            }
          )
          .subscribe();

        set({ _realtimeChannel: channel });
      },

      unsubscribeRealtime: () => {
        const channel = get()._realtimeChannel;
        if (channel) {
          supabase.removeChannel(channel);
          set({ _realtimeChannel: null });
        }
      },
    }),
    {
      name: 'creatyng-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
