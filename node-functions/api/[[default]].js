const ACCESS_TOKEN_COOKIE = 'ya_access_token';
const REFRESH_TOKEN_COOKIE = 'ya_refresh_token';

function getSupabaseConfig(env = {}) {
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey =
        env.SUPABASE_ANON_KEY ||
        env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error('服务端缺少 Supabase 配置，请设置 SUPABASE_URL/SUPABASE_ANON_KEY（或 VITE_* 变量）。');
    }

    return { url, anonKey };
}

function responseJson(status, payload, baseHeaders) {
    const headers = new Headers(baseHeaders || {});
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    return new Response(JSON.stringify(payload), { status, headers });
}

function methodNotAllowed(allowMethods, baseHeaders) {
    const headers = new Headers(baseHeaders || {});
    headers.set('Allow', allowMethods.join(', '));
    return responseJson(405, { error: 'Method Not Allowed' }, headers);
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

function toCookie(name, value, options = {}) {
    const secure = true;
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
    if (secure) {
        parts.push('Secure');
    }
    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${options.maxAge}`);
    }
    return parts.join('; ');
}

function clearSessionCookies(headers) {
    headers.append('Set-Cookie', toCookie(ACCESS_TOKEN_COOKIE, '', { maxAge: 0 }));
    headers.append('Set-Cookie', toCookie(REFRESH_TOKEN_COOKIE, '', { maxAge: 0 }));
}

function setSessionCookies(headers, session) {
    const accessExpiresIn = Number.isFinite(session?.expires_in) ? Math.max(60, session.expires_in - 30) : 3600;
    headers.append('Set-Cookie', toCookie(ACCESS_TOKEN_COOKIE, session.access_token, { maxAge: accessExpiresIn }));
    headers.append('Set-Cookie', toCookie(REFRESH_TOKEN_COOKIE, session.refresh_token, { maxAge: 60 * 60 * 24 * 30 }));
}

function getErrorMessage(result, fallback) {
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

async function readJsonBody(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

async function requestSupabase({
    env,
    path,
    method = 'GET',
    body,
    accessToken,
    isAuthApi = false,
    extraHeaders = {},
}) {
    const { url, anonKey } = getSupabaseConfig(env);
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

async function isAdminUser(env, accessToken, userId) {
    const params = new URLSearchParams({
        select: 'id',
        id: `eq.${userId}`,
        limit: '1',
    });

    const result = await requestSupabase({
        env,
        path: `admin_users?${params.toString()}`,
        method: 'GET',
        accessToken,
    });

    return result.ok && Array.isArray(result.data) && result.data.length > 0;
}

async function fetchUser(env, accessToken) {
    return requestSupabase({
        env,
        path: 'user',
        method: 'GET',
        accessToken,
        isAuthApi: true,
    });
}

async function refreshSession(env, refreshToken) {
    return requestSupabase({
        env,
        path: 'token?grant_type=refresh_token',
        method: 'POST',
        body: { refresh_token: refreshToken },
        isAuthApi: true,
    });
}

async function signInWithPassword(env, email, password) {
    return requestSupabase({
        env,
        path: 'token?grant_type=password',
        method: 'POST',
        body: { email, password },
        isAuthApi: true,
    });
}

async function getSession(context, options = {}) {
    const requireAdmin = Boolean(options.requireAdmin);
    const headers = new Headers();
    const cookies = parseCookies(context.request.headers.get('cookie') || '');
    let accessToken = cookies[ACCESS_TOKEN_COOKIE];
    let refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!accessToken && !refreshToken) {
        return { session: null, headers };
    }

    let user = null;

    if (accessToken) {
        const userResult = await fetchUser(context.env, accessToken);
        if (userResult.ok && userResult.data?.id && userResult.data?.email) {
            user = {
                id: userResult.data.id,
                email: userResult.data.email,
            };
        }
    }

    if (!user && refreshToken) {
        const refreshResult = await refreshSession(context.env, refreshToken);
        if (refreshResult.ok && refreshResult.data?.access_token) {
            accessToken = refreshResult.data.access_token;
            refreshToken = refreshResult.data.refresh_token || refreshToken;
            setSessionCookies(headers, refreshResult.data);

            if (refreshResult.data.user?.id && refreshResult.data.user?.email) {
                user = {
                    id: refreshResult.data.user.id,
                    email: refreshResult.data.user.email,
                };
            } else {
                const refreshedUserResult = await fetchUser(context.env, accessToken);
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
        clearSessionCookies(headers);
        return { session: null, headers };
    }

    if (requireAdmin) {
        const admin = await isAdminUser(context.env, accessToken, user.id);
        if (!admin) {
            clearSessionCookies(headers);
            return { session: null, headers };
        }
    }

    return {
        session: {
            accessToken,
            refreshToken,
            user,
        },
        headers,
    };
}

function normalizeStatus(status) {
    return status === 'draft' ? 'draft' : 'published';
}

function validateCreatePayload(table, payload) {
    if (table === 'articles') {
        return payload.title && payload.content ? null : '文章标题和内容不能为空。';
    }
    if (table === 'projects') {
        return payload.title && payload.description && payload.repo_url ? null : '项目标题、描述、仓库链接不能为空。';
    }
    return payload.title && payload.abstract && payload.journal ? null : '研究标题、摘要、来源不能为空。';
}

function buildInsertPayload(table, body) {
    if (table === 'articles') {
        return {
            title: String(body.title || '').trim(),
            excerpt: body.excerpt ? String(body.excerpt) : null,
            content: String(body.content || ''),
            pdf_url: body.pdfUrl ? String(body.pdfUrl) : null,
            external_url: body.externalUrl ? String(body.externalUrl) : null,
            tags: Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : [],
            status: normalizeStatus(body.status),
        };
    }

    if (table === 'projects') {
        return {
            title: String(body.title || '').trim(),
            description: String(body.description || ''),
            repo_url: String(body.repoUrl || ''),
            tech_stack: Array.isArray(body.techStack) ? body.techStack.map((item) => String(item)) : [],
            image_url: String(body.imageUrl || ''),
            year: String(body.year || ''),
            stars: body.stars === undefined || body.stars === null || body.stars === '' ? null : Number(body.stars),
            content: body.content ? String(body.content) : null,
            status: normalizeStatus(body.status),
        };
    }

    return {
        title: String(body.title || '').trim(),
        abstract: String(body.abstract || ''),
        journal: String(body.journal || ''),
        pdf_url: body.pdfUrl ? String(body.pdfUrl) : null,
        image_url: String(body.imageUrl || ''),
        year: String(body.year || ''),
        category: String(body.category || ''),
        status: normalizeStatus(body.status),
    };
}

function buildUpdatePayload(table, body) {
    const payload = {
        updated_at: new Date().toISOString(),
    };

    if (table === 'articles') {
        if (body.title !== undefined) payload.title = String(body.title).trim();
        if (body.excerpt !== undefined) payload.excerpt = body.excerpt ? String(body.excerpt) : null;
        if (body.content !== undefined) payload.content = String(body.content);
        if (body.pdfUrl !== undefined) payload.pdf_url = body.pdfUrl ? String(body.pdfUrl) : null;
        if (body.externalUrl !== undefined) payload.external_url = body.externalUrl ? String(body.externalUrl) : null;
        if (body.tags !== undefined) payload.tags = Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : [];
        if (body.status !== undefined) payload.status = normalizeStatus(body.status);
        return payload;
    }

    if (table === 'projects') {
        if (body.title !== undefined) payload.title = String(body.title).trim();
        if (body.description !== undefined) payload.description = String(body.description);
        if (body.repoUrl !== undefined) payload.repo_url = String(body.repoUrl);
        if (body.techStack !== undefined) payload.tech_stack = Array.isArray(body.techStack) ? body.techStack.map((item) => String(item)) : [];
        if (body.imageUrl !== undefined) payload.image_url = String(body.imageUrl);
        if (body.year !== undefined) payload.year = String(body.year);
        if (body.stars !== undefined) payload.stars = body.stars === null || body.stars === '' ? null : Number(body.stars);
        if (body.content !== undefined) payload.content = body.content ? String(body.content) : null;
        if (body.status !== undefined) payload.status = normalizeStatus(body.status);
        return payload;
    }

    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.abstract !== undefined) payload.abstract = String(body.abstract);
    if (body.journal !== undefined) payload.journal = String(body.journal);
    if (body.pdfUrl !== undefined) payload.pdf_url = body.pdfUrl ? String(body.pdfUrl) : null;
    if (body.imageUrl !== undefined) payload.image_url = String(body.imageUrl);
    if (body.year !== undefined) payload.year = String(body.year);
    if (body.category !== undefined) payload.category = String(body.category);
    if (body.status !== undefined) payload.status = normalizeStatus(body.status);
    return payload;
}

function parseTableFromPath(subPath) {
    const segments = subPath.split('/').filter(Boolean);
    if (segments[0] !== 'content') {
        return null;
    }
    const table = segments[1];
    return table === 'articles' || table === 'projects' || table === 'papers' ? table : null;
}

async function handleAuth(context, subPath, method) {
    if (subPath === 'auth/login') {
        if (method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        const body = await readJsonBody(context.request);
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!email || !password) {
            return responseJson(400, { error: '请输入邮箱和密码。' });
        }

        const signInResult = await signInWithPassword(context.env, email, password);
        if (!signInResult.ok) {
            const headers = new Headers();
            clearSessionCookies(headers);
            return responseJson(401, { error: getErrorMessage(signInResult, '登录失败，请检查邮箱和密码。') }, headers);
        }

        const session = signInResult.data;
        const user = session?.user;
        if (!session?.access_token || !session?.refresh_token || !user?.id || !user?.email) {
            const headers = new Headers();
            clearSessionCookies(headers);
            return responseJson(401, { error: '登录失败：会话信息不完整。' }, headers);
        }

        const admin = await isAdminUser(context.env, session.access_token, user.id);
        if (!admin) {
            const headers = new Headers();
            clearSessionCookies(headers);
            return responseJson(403, { error: '该账号不是后台管理员，无法进入后台。' }, headers);
        }

        const headers = new Headers();
        setSessionCookies(headers, session);

        return responseJson(
            200,
            {
                user: {
                    uid: user.id,
                    email: user.email,
                },
            },
            headers,
        );
    }

    if (subPath === 'auth/session') {
        if (method !== 'GET') {
            return methodNotAllowed(['GET']);
        }

        const { session, headers } = await getSession(context, { requireAdmin: true });
        if (!session) {
            return responseJson(200, { user: null }, headers);
        }

        return responseJson(
            200,
            {
                user: {
                    uid: session.user.id,
                    email: session.user.email,
                },
            },
            headers,
        );
    }

    if (subPath === 'auth/logout') {
        if (method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        const headers = new Headers();
        clearSessionCookies(headers);
        return responseJson(200, { ok: true }, headers);
    }

    return null;
}

async function handleContent(context, subPath, method, requestUrl) {
    const table = parseTableFromPath(subPath);
    if (!table) {
        return null;
    }

    const includeDrafts =
        requestUrl.searchParams.get('includeDrafts') === '1' || requestUrl.searchParams.get('includeDrafts') === 'true';

    if (method === 'GET') {
        let sessionResult = { session: null, headers: new Headers() };
        if (includeDrafts) {
            sessionResult = await getSession(context, { requireAdmin: true });
            if (!sessionResult.session) {
                return responseJson(401, { error: '未登录或权限不足。' }, sessionResult.headers);
            }
        }

        const params = new URLSearchParams({
            select: '*',
            order: 'created_at.desc',
        });
        if (!includeDrafts) {
            params.set('status', 'eq.published');
        }

        const result = await requestSupabase({
            env: context.env,
            path: `${table}?${params.toString()}`,
            method: 'GET',
            accessToken: sessionResult.session?.accessToken,
        });

        if (!result.ok) {
            return responseJson(result.status, { error: getErrorMessage(result, `获取${table}失败`) }, sessionResult.headers);
        }

        return responseJson(200, { data: Array.isArray(result.data) ? result.data : [] }, sessionResult.headers);
    }

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
        return methodNotAllowed(['GET', 'POST', 'PATCH', 'DELETE']);
    }

    const sessionResult = await getSession(context, { requireAdmin: true });
    if (!sessionResult.session) {
        return responseJson(401, { error: '未登录或权限不足。' }, sessionResult.headers);
    }

    if (method === 'POST') {
        const body = await readJsonBody(context.request);
        const payload = buildInsertPayload(table, body);
        const validateMessage = validateCreatePayload(table, payload);
        if (validateMessage) {
            return responseJson(400, { error: validateMessage }, sessionResult.headers);
        }

        const result = await requestSupabase({
            env: context.env,
            path: `${table}?select=*`,
            method: 'POST',
            accessToken: sessionResult.session.accessToken,
            body: payload,
            extraHeaders: {
                Prefer: 'return=representation',
            },
        });

        if (!result.ok) {
            return responseJson(result.status, { error: getErrorMessage(result, `创建${table}失败`) }, sessionResult.headers);
        }

        const created = Array.isArray(result.data) ? result.data[0] : null;
        if (!created) {
            return responseJson(500, { error: `创建${table}失败：未返回数据。` }, sessionResult.headers);
        }

        return responseJson(200, { data: created }, sessionResult.headers);
    }

    const id = requestUrl.searchParams.get('id') || '';
    if (!id) {
        return responseJson(400, { error: `缺少${table} id。` }, sessionResult.headers);
    }

    if (method === 'PATCH') {
        const body = await readJsonBody(context.request);
        const payload = buildUpdatePayload(table, body);
        const params = new URLSearchParams({
            id: `eq.${id}`,
            select: '*',
        });

        const result = await requestSupabase({
            env: context.env,
            path: `${table}?${params.toString()}`,
            method: 'PATCH',
            accessToken: sessionResult.session.accessToken,
            body: payload,
            extraHeaders: {
                Prefer: 'return=representation',
            },
        });

        if (!result.ok) {
            return responseJson(result.status, { error: getErrorMessage(result, `更新${table}失败`) }, sessionResult.headers);
        }

        const updated = Array.isArray(result.data) ? result.data[0] : null;
        if (!updated) {
            return responseJson(404, { error: `更新${table}失败：未找到对应记录。` }, sessionResult.headers);
        }

        return responseJson(200, { data: updated }, sessionResult.headers);
    }

    const params = new URLSearchParams({
        id: `eq.${id}`,
    });

    const result = await requestSupabase({
        env: context.env,
        path: `${table}?${params.toString()}`,
        method: 'DELETE',
        accessToken: sessionResult.session.accessToken,
    });

    if (!result.ok) {
        return responseJson(result.status, { error: getErrorMessage(result, `删除${table}失败`) }, sessionResult.headers);
    }

    return responseJson(200, { ok: true }, sessionResult.headers);
}

export default async function onRequest(context) {
    try {
        const requestUrl = new URL(context.request.url);
        if (!requestUrl.pathname.startsWith('/api/')) {
            return responseJson(404, { error: 'Not Found' });
        }

        const subPath = requestUrl.pathname.replace(/^\/api\//, '');
        const method = (context.request.method || 'GET').toUpperCase();

        const authResponse = await handleAuth(context, subPath, method);
        if (authResponse) {
            return authResponse;
        }

        const contentResponse = await handleContent(context, subPath, method, requestUrl);
        if (contentResponse) {
            return contentResponse;
        }

        return responseJson(404, { error: 'Not Found' });
    } catch (error) {
        return responseJson(500, {
            error: `API 代理异常：${error instanceof Error ? error.message : '未知错误'}`,
        });
    }
}
