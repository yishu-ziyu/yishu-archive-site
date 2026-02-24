import { User } from '../types';
import { requestJson } from './apiClient';
import { isSupabaseConfigured } from './supabase';

export type AuthChangeEvent = 'INITIAL_SESSION' | 'TOKEN_REFRESHED' | 'SIGNED_OUT';

type AuthPayload = {
    user: User | null;
};

export async function getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) {
        return null;
    }
    const response = await requestJson<AuthPayload>('/api/auth/session');
    return response.user;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
    const response = await requestJson<AuthPayload>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (!response.user) {
        throw new Error('登录失败，请检查邮箱和密码。');
    }

    return response.user;
}

export async function logout(): Promise<void> {
    await requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}

export function subscribeAuthState(
    callback: (event: AuthChangeEvent, user: User | null) => void,
): () => void {
    if (!isSupabaseConfigured) {
        return () => undefined;
    }

    let disposed = false;
    let lastUserId: string | null = null;

    const emitIfChanged = async () => {
        try {
            const user = await getCurrentUser();
            if (disposed) {
                return;
            }

            const nextUserId = user?.uid ?? null;
            if (nextUserId !== lastUserId) {
                callback(nextUserId ? 'TOKEN_REFRESHED' : 'SIGNED_OUT', user);
                lastUserId = nextUserId;
            }
        } catch {
            if (disposed) {
                return;
            }
            if (lastUserId !== null) {
                callback('SIGNED_OUT', null);
                lastUserId = null;
            }
        }
    };

    void (async () => {
        try {
            const user = await getCurrentUser();
            if (disposed) {
                return;
            }
            lastUserId = user?.uid ?? null;
            callback('INITIAL_SESSION', user);
        } catch {
            if (disposed) {
                return;
            }
            lastUserId = null;
            callback('SIGNED_OUT', null);
        }
    })();

    const intervalId = window.setInterval(() => {
        void emitIfChanged();
    }, 60_000);

    const onFocus = () => {
        void emitIfChanged();
    };
    window.addEventListener('focus', onFocus);

    return () => {
        disposed = true;
        window.clearInterval(intervalId);
        window.removeEventListener('focus', onFocus);
    };
}
