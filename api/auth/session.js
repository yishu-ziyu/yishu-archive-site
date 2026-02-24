import { getSessionFromCookies, json, methodNotAllowed } from '../_utils/supabaseProxy.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return methodNotAllowed(res, ['GET']);
    }

    try {
        const session = await getSessionFromCookies(req, res, { requireAdmin: true });
        if (!session) {
            return json(res, 200, { user: null });
        }

        return json(res, 200, {
            user: {
                uid: session.user.id,
                email: session.user.email,
            },
        });
    } catch (error) {
        return json(res, 500, {
            error: `会话检查失败：${error instanceof Error ? error.message : '未知错误'}`,
        });
    }
}
