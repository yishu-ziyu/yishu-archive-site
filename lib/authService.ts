import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '../types';
import { ensureSupabase, isSupabaseConfigured, supabase } from './supabase';

function toAppUser(session: Session | null): User | null {
    const raw = session?.user;
    if (!raw?.email) {
        return null;
    }
    return {
        uid: raw.id,
        email: raw.email,
    };
}

async function resolveAdminUser(session: Session | null): Promise<User | null> {
    const appUser = toAppUser(session);
    if (!appUser) {
        return null;
    }

    const client = ensureSupabase();
    const { data, error } = await client.from('admin_users').select('id').eq('id', appUser.uid).maybeSingle();
    if (error) {
        throw error;
    }
    if (!data) {
        return null;
    }
    return appUser;
}

export async function getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        throw error;
    }
    const adminUser = await resolveAdminUser(data.session);
    if (data.session && !adminUser) {
        await supabase.auth.signOut();
    }
    return adminUser;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
    const client = ensureSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
        throw error || new Error('登录失败，请检查邮箱和密码。');
    }

    const adminUser = await resolveAdminUser(data.session);
    if (!adminUser) {
        await client.auth.signOut();
        throw new Error('该账号不是后台管理员，无法进入后台。');
    }

    return adminUser;
}

export async function logout(): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
        throw error;
    }
}

export function subscribeAuthState(
    callback: (event: AuthChangeEvent, user: User | null) => void,
): () => void {
    if (!isSupabaseConfigured || !supabase) {
        return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        void (async () => {
            try {
                const adminUser = await resolveAdminUser(session);
                if (session && !adminUser) {
                    await supabase.auth.signOut();
                    callback(event, null);
                    return;
                }
                callback(event, adminUser);
            } catch {
                callback(event, null);
            }
        })();
    });

    return () => {
        data.subscription.unsubscribe();
    };
}
