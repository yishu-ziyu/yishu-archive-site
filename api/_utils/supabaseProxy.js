const ACCESS_TOKEN_COOKIE = 'ya_access_token';
const REFRESH_TOKEN_COOKIE = 'ya_refresh_token';

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error('服务端缺少 Supabase 配置，请设置 SUPABASE_URL/SUPABASE_ANON_KEY（或 VITE_* 变量）。');
    }

    return { url, anonKey };
}

function appendSetCookies(res, cookies) {
    const existing = res.getHeader('Set-Cookie');
    const nextCookies = Array.isArray(existing)
        ? [...existing, ...cookies]
        : existing
          ? [String(existing), ...cookies]
          : cookies;
    res.setHeader('Set-Cookie', nextCookies);
}

function toCookie(name, value, options = {}) {
    const secure = process.env.NODE_ENV === 'production';
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
    if (secure) {
        parts.push('Secure');
    }
    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${options.maxAge}`);
    }
    return parts.join('; ');
}

function parseCookies(rawCookie = '') {
    return rawCookie
        .split(';')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .reduce((acc, segment) => {
            const index = segment.indexOf('=');
            if (index <= 0) {
                return acc;
            }
            const key = segment.slice(0, index).trim();
            const value = segment.slice(index + 1).trim();
            try {
                acc[key] = decodeURIComponent(value);
            } catch {
                acc[key] = value;
            }
            return acc;
        }, {});
}

export function readJsonBody(req) {
    if (!req.body) {
        return {};
    }
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }
    }
    return req.body;
}

export function json(res, status, payload) {
    res.status(status).json(payload);
}

export function methodNotAllowed(res, allowMethods) {
    res.setHeader('Allow', allowMethods);
    return json(res, 405, { error: 'Method Not Allowed' });
}

export function clearSessionCookies(res) {
    appendSetCookies(res, [
        toCookie(ACCESS_TOKEN_COOKIE, '', { maxAge: 0 }),
        toCookie(REFRESH_TOKEN_COOKIE, '', { maxAge: 0 }),
    ]);
}

export function setSessionCookies(res, session) {
    const accessExpiresIn = Number.isFinite(session?.expires_in) ? Math.max(60, session.expires_in - 30) : 3600;
    appendSetCookies(res, [
        toCookie(ACCESS_TOKEN_COOKIE, session.access_token, { maxAge: accessExpiresIn }),
        toCookie(REFRESH_TOKEN_COOKIE, session.refresh_token, { maxAge: 60 * 60 * 24 * 30 }),
    ]);
}

export async function requestSupabase({
    path,
    method = 'GET',
    body,
    accessToken,
    isAuthApi = false,
    extraHeaders = {},
}) {
    const { url, anonKey } = getSupabaseConfig();
    const baseUrl = isAuthApi ? `${url}/auth/v1` : `${url}/rest/v1`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

    const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken || anonKey}`,
        ...extraHeaders,
    };

    const init = {
        method,
        headers,
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}/${normalizedPath}`, init);
    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = text || null;
    }

    return {
        ok: response.ok,
        status: response.status,
        data,
    };
}

export async function signInWithPassword(email, password) {
    return requestSupabase({
        path: 'token?grant_type=password',
        method: 'POST',
        body: { email, password },
        isAuthApi: true,
    });
}

export async function refreshSession(refreshToken) {
    return requestSupabase({
        path: 'token?grant_type=refresh_token',
        method: 'POST',
        body: { refresh_token: refreshToken },
        isAuthApi: true,
    });
}

export async function fetchUser(accessToken) {
    return requestSupabase({
        path: 'user',
        method: 'GET',
        accessToken,
        isAuthApi: true,
    });
}

export async function isAdminUser(accessToken, userId) {
    const params = new URLSearchParams({
        select: 'id',
        id: `eq.${userId}`,
        limit: '1',
    });

    const result = await requestSupabase({
        path: `admin_users?${params.toString()}`,
        method: 'GET',
        accessToken,
    });

    if (!result.ok || !Array.isArray(result.data)) {
        return false;
    }

    return result.data.length > 0;
}

export async function getSessionFromCookies(req, res, options = {}) {
    const requireAdmin = Boolean(options.requireAdmin);
    const cookies = parseCookies(req.headers.cookie || '');
    let accessToken = cookies[ACCESS_TOKEN_COOKIE];
    let refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!accessToken && !refreshToken) {
        return null;
    }

    let user = null;

    if (accessToken) {
        const userResult = await fetchUser(accessToken);
        if (userResult.ok && userResult.data?.id && userResult.data?.email) {
            user = {
                id: userResult.data.id,
                email: userResult.data.email,
            };
        }
    }

    if (!user && refreshToken) {
        const refreshResult = await refreshSession(refreshToken);
        if (refreshResult.ok && refreshResult.data?.access_token) {
            accessToken = refreshResult.data.access_token;
            refreshToken = refreshResult.data.refresh_token || refreshToken;
            setSessionCookies(res, refreshResult.data);

            if (refreshResult.data.user?.id && refreshResult.data.user?.email) {
                user = {
                    id: refreshResult.data.user.id,
                    email: refreshResult.data.user.email,
                };
            } else {
                const refreshedUserResult = await fetchUser(accessToken);
                if (refreshedUserResult.ok && refreshedUserResult.data?.id && refreshedUserResult.data?.email) {
                    user = {
                        id: refreshedUserResult.data.id,
                        email: refreshedUserResult.data.email,
                    };
                }
            }
        }
    }

    if (!user) {
        clearSessionCookies(res);
        return null;
    }

    if (requireAdmin) {
        const admin = await isAdminUser(accessToken, user.id);
        if (!admin) {
            clearSessionCookies(res);
            return null;
        }
    }

    return {
        accessToken,
        refreshToken,
        user,
    };
}

export function getErrorMessage(result, fallback) {
    if (!result || typeof result !== 'object') {
        return fallback;
    }
    if (result.data?.error_description) {
        return result.data.error_description;
    }
    if (result.data?.message) {
        return result.data.message;
    }
    if (result.data?.error) {
        return result.data.error;
    }
    return fallback;
}
