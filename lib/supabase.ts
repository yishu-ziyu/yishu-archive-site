const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// 前端不再直接连接 Supabase，统一走同域 /api 代理。
export const supabase = null;

export function ensureSupabase() {
    throw new Error('前端已切换为 API 代理模式，不再暴露 Supabase 客户端。');
}
