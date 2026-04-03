import { supabase } from './supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: string;
  credits: number;
  plan_credits: number;
  bonus_credits: number;
  role: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
  asaas_customer_id: string | null;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  provider: string;
  external_id: string | null;
  amount_cents: number;
  credits: number;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface AdminGeneration {
  id: string;
  user_id: string | null;
  provider: string | null;
  status: string;
  credits_used: number;
  prompt_len: number | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  error_message: string | null;
  created_at: string;
  user_email?: string;
}

export interface DashboardKPIs {
  totalUsers: number;
  totalPro: number;
  totalTeam: number;
  totalFree: number;
  totalGenerations: number;
  totalRevenue: number;
  mrr: number;
  newUsersToday: number;
  newUsersWeek: number;
  activeUsersWeek: number;
  totalCreditsConsumed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminService = {

  // ── DASHBOARD KPIs ──────────────────────────────────────────────────────────

  async fetchDashboardKPIs(): Promise<DashboardKPIs> {
    // Total users by plan
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalPro } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro');
    const { count: totalTeam } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'team');
    const totalFree = (totalUsers ?? 0) - (totalPro ?? 0) - (totalTeam ?? 0);

    // Total generations
    const { count: totalGenerations } = await supabase.from('generations').select('*', { count: 'exact', head: true });

    // Total revenue (sum of paid payments)
    const { data: payments } = await supabase.from('payments').select('amount_cents').eq('status', 'paid');
    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

    // MRR estimate
    const mrr = (totalPro ?? 0) * 49.90 + (totalTeam ?? 0) * 149.90;

    // New users today/week
    const { count: newUsersToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart());
    const { count: newUsersWeek } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7));

    // Active users (updated in last 7 days)
    const { count: activeUsersWeek } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', daysAgo(7));

    // Total credits consumed (sum of negative credit_history entries)
    const { data: debits } = await supabase.from('credit_history').select('amount').lt('amount', 0);
    const totalCreditsConsumed = Math.abs((debits || []).reduce((sum, d) => sum + (d.amount || 0), 0));

    return {
      totalUsers: totalUsers ?? 0,
      totalPro: totalPro ?? 0,
      totalTeam: totalTeam ?? 0,
      totalFree: Math.max(0, totalFree),
      totalGenerations: totalGenerations ?? 0,
      totalRevenue,
      mrr,
      newUsersToday: newUsersToday ?? 0,
      newUsersWeek: newUsersWeek ?? 0,
      activeUsersWeek: activeUsersWeek ?? 0,
      totalCreditsConsumed,
    };
  },

  async fetchRevenueByPeriod(days = 30): Promise<Array<{ date: string; revenue: number }>> {
    const since = daysAgo(days);
    const { data } = await supabase
      .from('payments')
      .select('amount_cents, created_at')
      .eq('status', 'paid')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) return [];

    // Group by date
    const byDate = new Map<string, number>();
    for (const p of data) {
      const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      byDate.set(date, (byDate.get(date) || 0) + (p.amount_cents || 0) / 100);
    }
    return Array.from(byDate.entries()).map(([date, revenue]) => ({ date, revenue }));
  },

  // ── USERS ───────────────────────────────────────────────────────────────────

  async fetchUsers(
    page = 1,
    perPage = 20,
    search?: string,
    planFilter?: string,
    sortBy = 'created_at',
    sortDir: 'asc' | 'desc' = 'desc',
  ): Promise<{ users: AdminUser[]; total: number }> {
    let query = supabase
      .from('profiles')
      .select('id, name, email, avatar_url, plan, credits, plan_credits, bonus_credits, role, created_at, updated_at, stripe_customer_id, asaas_customer_id', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    if (planFilter && planFilter !== 'all') {
      query = query.eq('plan', planFilter);
    }

    query = query.order(sortBy, { ascending: sortDir === 'asc' });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('[adminService] fetchUsers error:', error.message);
      return { users: [], total: 0 };
    }
    return { users: (data || []) as AdminUser[], total: count ?? 0 };
  },

  async updateUserCredits(userId: string, bonusAmount: number, description: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_credits, bonus_credits')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    const newBonus = Math.max(0, (profile.bonus_credits ?? 0) + bonusAmount);
    const newTotal = (profile.plan_credits ?? 0) + newBonus;

    await supabase.from('profiles').update({
      bonus_credits: newBonus,
      credits: newTotal,
    }).eq('id', userId);

    await supabase.from('credit_history').insert({
      user_id: userId,
      amount: bonusAmount,
      type: bonusAmount >= 0 ? 'admin_bonus' : 'admin_debit',
      description: description || `Admin credit adjustment: ${bonusAmount > 0 ? '+' : ''}${bonusAmount}`,
    });
  },

  async updateUserPlan(userId: string, newPlan: string): Promise<void> {
    const planCreditsMap: Record<string, number> = { free: 0, pro: 500, team: 2000 };
    const planCredits = planCreditsMap[newPlan] ?? 0;

    const { data: profile } = await supabase
      .from('profiles')
      .select('bonus_credits')
      .eq('id', userId)
      .single();

    const newTotal = planCredits + (profile?.bonus_credits ?? 0);

    await supabase.from('profiles').update({
      plan: newPlan,
      plan_credits: planCredits,
      credits: newTotal,
    }).eq('id', userId);
  },

  async updateUserRole(userId: string, newRole: string): Promise<void> {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  },

  // ── PAYMENTS ────────────────────────────────────────────────────────────────

  async fetchPayments(
    page = 1,
    perPage = 20,
    statusFilter?: string,
  ): Promise<{ payments: AdminPayment[]; total: number }> {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    query = query.order('created_at', { ascending: false });
    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('[adminService] fetchPayments error:', error.message);
      return { payments: [], total: 0 };
    }

    // Enrich with user info
    const payments = (data || []) as AdminPayment[];
    const userIds = [...new Set(payments.map(p => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      for (const payment of payments) {
        const profile = profileMap.get(payment.user_id);
        if (profile) {
          payment.user_email = profile.email;
          payment.user_name = profile.name;
        }
      }
    }

    return { payments, total: count ?? 0 };
  },

  // ── GENERATIONS ─────────────────────────────────────────────────────────────

  async fetchGenerations(
    page = 1,
    perPage = 20,
  ): Promise<{ generations: AdminGeneration[]; total: number }> {
    const from = (page - 1) * perPage;
    const { data, count, error } = await supabase
      .from('generations')
      .select('id, user_id, provider, status, credits_used, prompt_len, duration_ms, width, height, error_message, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1);

    if (error) {
      console.error('[adminService] fetchGenerations error:', error.message);
      return { generations: [], total: 0 };
    }

    const generations = (data || []) as AdminGeneration[];
    const userIds = [...new Set(generations.map(g => g.user_id).filter(Boolean))] as string[];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      for (const gen of generations) {
        const profile = gen.user_id ? profileMap.get(gen.user_id) : null;
        if (profile) gen.user_email = profile.email;
      }
    }

    return { generations, total: count ?? 0 };
  },

  // ── NOTIFICATIONS ───────────────────────────────────────────────────────────

  async fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[adminService] fetchNotifications failed:', e);
      return [];
    }
  },

  async createNotification(data: {
    type: string;
    recipients: string;
    title: string;
    message: string;
    send_email: boolean;
    pinned: boolean;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('admin_notifications')
        .insert({ ...data, sent_by: user?.id || null })
        .select()
        .single();

      if (error) throw error;

      if (data.send_email && result?.id) {
        supabase.functions.invoke('send-notification-email', {
          body: { notificationId: result.id },
        }).catch((e) => console.warn('[adminService] email send failed:', e));
      }

      return result;
    } catch (e) {
      console.warn('[adminService] createNotification failed:', e);
      return null;
    }
  },

  async deleteNotification(id: string) {
    const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
    if (error) console.warn('[adminService] deleteNotification failed:', error);
  },

  // ── CREDIT HISTORY ──────────────────────────────────────────────────────────

  async fetchUserCreditHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('credit_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[adminService] fetchUserCreditHistory failed:', error);
      return [];
    }
    return data || [];
  },

  // ── REALTIME ────────────────────────────────────────────────────────────────

  subscribeToChanges(callback: (payload: unknown) => void) {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generations' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_history' }, callback)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
};
