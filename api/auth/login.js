import {
    clearSessionCookies,
    getErrorMessage,
    isAdminUser,
    json,
    methodNotAllowed,
    readJsonBody,
    setSessionCookies,
    signInWithPassword,
} from '../_utils/supabaseProxy.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
    }

    try {
        const body = readJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!email || !password) {
            return json(res, 400, { error: '请输入邮箱和密码。' });
        }

        const signInResult = await signInWithPassword(email, password);
        if (!signInResult.ok) {
            clearSessionCookies(res);
            return json(res, 401, { error: getErrorMessage(signInResult, '登录失败，请检查邮箱和密码。') });
        }

        const session = signInResult.data;
        const user = session?.user;
        if (!session?.access_token || !session?.refresh_token || !user?.id || !user?.email) {
            clearSessionCookies(res);
            return json(res, 401, { error: '登录失败：会话信息不完整。' });
        }

        const admin = await isAdminUser(session.access_token, user.id);
        if (!admin) {
            clearSessionCookies(res);
            return json(res, 403, { error: '该账号不是后台管理员，无法进入后台。' });
        }

        setSessionCookies(res, session);

        return json(res, 200, {
            user: {
                uid: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        clearSessionCookies(res);
        return json(res, 500, {
            error: `登录接口异常：${error instanceof Error ? error.message : '未知错误'}`,
        });
    }
}
