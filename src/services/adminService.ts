import { supabase } from './supabaseClient';

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_USERS = [
  { id: '1', name: 'Ana Souza', email: 'ana@email.com', plan: 'Pro', credits: 380, totalCredits: 500, role: 'user', createdAt: '2026-01-15' },
  { id: '2', name: 'Bruno Lima', email: 'bruno@email.com', plan: 'Free', credits: 4, totalCredits: 10, role: 'user', createdAt: '2026-01-20' },
  { id: '3', name: 'Carla Mendes', email: 'carla@agencia.com', plan: 'Team', credits: 1200, totalCredits: 1500, role: 'admin', createdAt: '2025-12-01' },
  { id: '4', name: 'Diego Rocha', email: 'diego@email.com', plan: 'Pro', credits: 210, totalCredits: 500, role: 'user', createdAt: '2026-02-03' },
  { id: '5', name: 'Elisa Ferreira', email: 'elisa@email.com', plan: 'Free', credits: 10, totalCredits: 10, role: 'user', createdAt: '2026-02-14' },
  { id: '6', name: 'Felipe Costa', email: 'felipe@design.io', plan: 'Team', credits: 890, totalCredits: 1500, role: 'user', createdAt: '2026-01-08' },
  { id: '7', name: 'Gabriela Alves', email: 'gabi@brand.co', plan: 'Pro', credits: 450, totalCredits: 500, role: 'user', createdAt: '2026-02-22' },
  { id: '8', name: 'Henrique Santos', email: 'henrique@email.com', plan: 'Free', credits: 2, totalCredits: 10, role: 'user', createdAt: '2026-03-01' },
  { id: '9', name: 'Isabela Torres', email: 'isa@commerce.com', plan: 'Pro', credits: 120, totalCredits: 500, role: 'user', createdAt: '2026-01-30' },
  { id: '10', name: 'João Pedro', email: 'jp@startup.io', plan: 'Team', credits: 1400, totalCredits: 1500, role: 'user', createdAt: '2025-11-15' },
  { id: '11', name: 'Karine Vieira', email: 'karine@email.com', plan: 'Free', credits: 7, totalCredits: 10, role: 'user', createdAt: '2026-03-05' },
  { id: '12', name: 'Lucas Martins', email: 'lucas@email.com', plan: 'Pro', credits: 340, totalCredits: 500, role: 'user', createdAt: '2026-02-10' },
  { id: '13', name: 'Marina Dias', email: 'marina@brand.com', plan: 'Pro', credits: 490, totalCredits: 500, role: 'user', createdAt: '2026-01-25' },
  { id: '14', name: 'Nando Gomes', email: 'nando@ecom.br', plan: 'Team', credits: 600, totalCredits: 1500, role: 'user', createdAt: '2025-12-20' },
  { id: '15', name: 'Olivia Ramos', email: 'olivia@creative.co', plan: 'Free', credits: 1, totalCredits: 10, role: 'user', createdAt: '2026-03-08' },
];

export const MOCK_LOGS = [
  { id: 'gen_001', userId: '1', userName: 'Ana Souza', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1800, provider: 'Gemini Flash', duration: '8.2s', time: '14:32' },
  { id: 'gen_002', userId: '3', userName: 'Carla Mendes', feature: 'Social Post', status: 'success', credits: 2, tokens: 1200, provider: 'Replicate', duration: '6.4s', time: '14:28' },
  { id: 'gen_003', userId: '7', userName: 'Gabriela Alves', feature: 'Photoshoot', status: 'error', credits: 0, tokens: 0, provider: 'Gemini Flash', duration: '—', time: '14:21' },
  { id: 'gen_004', userId: '4', userName: 'Diego Rocha', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1900, provider: 'Gemini Flash', duration: '9.1s', time: '14:15' },
  { id: 'gen_005', userId: '10', userName: 'João Pedro', feature: 'Social Post', status: 'success', credits: 2, tokens: 1100, provider: 'Replicate', duration: '5.8s', time: '14:10' },
  { id: 'gen_006', userId: '6', userName: 'Felipe Costa', feature: 'Photoshoot', status: 'success', credits: 4, tokens: 2200, provider: 'Gemini Pro', duration: '12.3s', time: '13:58' },
  { id: 'gen_007', userId: '13', userName: 'Marina Dias', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1750, provider: 'Gemini Flash', duration: '7.9s', time: '13:45' },
  { id: 'gen_008', userId: '2', userName: 'Bruno Lima', feature: 'Social Post', status: 'error', credits: 0, tokens: 0, provider: 'Replicate', duration: '—', time: '13:40' },
  { id: 'gen_009', userId: '9', userName: 'Isabela Torres', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1600, provider: 'Gemini Flash', duration: '8.5s', time: '13:35' },
  { id: 'gen_010', userId: '1', userName: 'Ana Souza', feature: 'Photoshoot', status: 'success', credits: 4, tokens: 2400, provider: 'Gemini Pro', duration: '11.2s', time: '13:20' },
  { id: 'gen_011', userId: '14', userName: 'Nando Gomes', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1820, provider: 'Gemini Flash', duration: '8.0s', time: '13:10' },
  { id: 'gen_012', userId: '12', userName: 'Lucas Martins', feature: 'Social Post', status: 'success', credits: 2, tokens: 1050, provider: 'Replicate', duration: '5.5s', time: '12:58' },
  { id: 'gen_013', userId: '7', userName: 'Gabriela Alves', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1700, provider: 'Gemini Flash', duration: '7.6s', time: '12:40' },
  { id: 'gen_014', userId: '3', userName: 'Carla Mendes', feature: 'Photoshoot', status: 'success', credits: 4, tokens: 2100, provider: 'Gemini Pro', duration: '10.8s', time: '12:30' },
  { id: 'gen_015', userId: '5', userName: 'Elisa Ferreira', feature: 'Social Post', status: 'error', credits: 0, tokens: 0, provider: 'Replicate', duration: '—', time: '12:15' },
  { id: 'gen_016', userId: '10', userName: 'João Pedro', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1900, provider: 'Gemini Flash', duration: '8.8s', time: '12:00' },
  { id: 'gen_017', userId: '4', userName: 'Diego Rocha', feature: 'Photoshoot', status: 'success', credits: 4, tokens: 2300, provider: 'Gemini Pro', duration: '11.5s', time: '11:45' },
  { id: 'gen_018', userId: '6', userName: 'Felipe Costa', feature: 'Social Post', status: 'success', credits: 2, tokens: 1150, provider: 'Replicate', duration: '6.1s', time: '11:30' },
  { id: 'gen_019', userId: '13', userName: 'Marina Dias', feature: 'Ecom Banner', status: 'success', credits: 3, tokens: 1680, provider: 'Gemini Flash', duration: '7.4s', time: '11:15' },
  { id: 'gen_020', userId: '9', userName: 'Isabela Torres', feature: 'Photoshoot', status: 'success', credits: 4, tokens: 2150, provider: 'Gemini Pro', duration: '10.5s', time: '11:00' },
];

export const MOCK_PROVIDERS = [
  { name: 'Gemini Pro', icon: '✦', tokensToday: 18400, totalCapacity: 50000, costEstimate: 2.76 },
  { name: 'Gemini Flash', icon: '⚡', tokensToday: 34200, totalCapacity: 100000, costEstimate: 1.71 },
  { name: 'Replicate', icon: '◈', tokensToday: 12600, totalCapacity: 40000, costEstimate: 3.15 },
];

export const MOCK_TOP_USERS = [
  { name: 'Carla Mendes', tokens: 4200, generations: 12, cost: 0.84 },
  { name: 'João Pedro', tokens: 3800, generations: 10, cost: 0.76 },
  { name: 'Felipe Costa', tokens: 3500, generations: 9, cost: 0.70 },
  { name: 'Ana Souza', tokens: 3200, generations: 8, cost: 0.64 },
  { name: 'Nando Gomes', tokens: 2900, generations: 7, cost: 0.58 },
  { name: 'Marina Dias', tokens: 2600, generations: 6, cost: 0.52 },
  { name: 'Diego Rocha', tokens: 2400, generations: 6, cost: 0.48 },
  { name: 'Gabriela Alves', tokens: 2200, generations: 5, cost: 0.44 },
  { name: 'Isabela Torres', tokens: 1900, generations: 5, cost: 0.38 },
  { name: 'Lucas Martins', tokens: 1600, generations: 4, cost: 0.32 },
];

export const MOCK_TRANSACTIONS = [
  { user: 'Ana Souza', type: 'subscription', amount: 29.0, date: '2026-03-01' },
  { user: 'Carla Mendes', type: 'subscription', amount: 79.0, date: '2026-03-01' },
  { user: 'Bruno Lima', type: 'recharge', amount: 9.9, date: '2026-03-02' },
  { user: 'Felipe Costa', type: 'subscription', amount: 79.0, date: '2026-03-03' },
  { user: 'Gabriela Alves', type: 'subscription', amount: 29.0, date: '2026-03-04' },
  { user: 'Diego Rocha', type: 'recharge', amount: 19.9, date: '2026-03-05' },
  { user: 'Isabela Torres', type: 'refund', amount: -29.0, date: '2026-03-06' },
  { user: 'João Pedro', type: 'subscription', amount: 79.0, date: '2026-03-07' },
  { user: 'Marina Dias', type: 'recharge', amount: 9.9, date: '2026-03-08' },
  { user: 'Nando Gomes', type: 'subscription', amount: 79.0, date: '2026-03-09' },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  async getOverviewStats() {
    // TODO: replace with Supabase aggregate queries
    return { mrr: 8400, activeUsers: 127, gensToday: 379, errorRate: 2.1 };
  },

  async getMRRHistory() {
    return [
      { month: 'Out', mrr: 3200 },
      { month: 'Nov', mrr: 4100 },
      { month: 'Dez', mrr: 5300 },
      { month: 'Jan', mrr: 6200 },
      { month: 'Fev', mrr: 7400 },
      { month: 'Mar', mrr: 8400 },
    ];
  },

  async getFeatureUsage() {
    return [
      { name: 'Ecom Banner', value: 42, color: '#ff713d' },
      { name: 'Social Post', value: 31, color: '#818cf8' },
      { name: 'Chat AI', value: 15, color: '#34d399' },
      { name: 'Photoshoot', value: 12, color: '#fbbf24' },
    ];
  },

  async getDailyGens() {
    return [
      { day: 'Seg', count: 48 },
      { day: 'Ter', count: 61 },
      { day: 'Qua', count: 55 },
      { day: 'Qui', count: 72 },
      { day: 'Sex', count: 89 },
      { day: 'Sáb', count: 34 },
      { day: 'Dom', count: 20 },
    ];
  },

  async getUsers(_filters?: { plan?: string; search?: string; page?: number }) {
    // TODO: supabase.from('profiles').select('*').range(...)
    return { users: MOCK_USERS, total: MOCK_USERS.length };
  },

  async getFinanceStats() {
    // TODO: Supabase aggregate
    return { mrr: 8400, churnRate: 3.2, conversionRate: 12.5 };
  },

  async getRevenueHistory() {
    return [
      { month: 'Abr', revenue: 2100 },
      { month: 'Mai', revenue: 2800 },
      { month: 'Jun', revenue: 3200 },
      { month: 'Jul', revenue: 3900 },
      { month: 'Ago', revenue: 4500 },
      { month: 'Set', revenue: 5100 },
      { month: 'Out', revenue: 5800 },
      { month: 'Nov', revenue: 6400 },
      { month: 'Dez', revenue: 7200 },
      { month: 'Jan', revenue: 7800 },
      { month: 'Fev', revenue: 8100 },
      { month: 'Mar', revenue: 8400 },
    ];
  },

  async getTransactions() {
    return MOCK_TRANSACTIONS;
  },

  async getGenerationLogs(_filters?: { status?: string; page?: number }) {
    // TODO: supabase.from('generation_logs').select('*, profiles(full_name)')
    return { logs: MOCK_LOGS, total: 1847 };
  },

  async getTokenStats() {
    // TODO: Supabase aggregate by provider
    return { providers: MOCK_PROVIDERS, topUsers: MOCK_TOP_USERS };
  },

  async getDailyTokensByProvider() {
    return [
      { day: 'Seg', geminiPro: 3200, geminiFlash: 5800, replicate: 2100 },
      { day: 'Ter', geminiPro: 4100, geminiFlash: 6200, replicate: 2400 },
      { day: 'Qua', geminiPro: 3800, geminiFlash: 5500, replicate: 1900 },
      { day: 'Qui', geminiPro: 4500, geminiFlash: 7100, replicate: 2800 },
      { day: 'Sex', geminiPro: 5200, geminiFlash: 8400, replicate: 3200 },
      { day: 'Sáb', geminiPro: 2100, geminiFlash: 3200, replicate: 1400 },
      { day: 'Dom', geminiPro: 1500, geminiFlash: 2000, replicate: 800 },
    ];
  },

  // Realtime subscription (ready for when Supabase is configured)
  subscribeToChanges(callback: (payload: unknown) => void) {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generation_logs' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_history' }, callback)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
};
