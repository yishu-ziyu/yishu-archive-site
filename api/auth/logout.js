import { clearSessionCookies, json, methodNotAllowed } from '../_utils/supabaseProxy.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
    }

    clearSessionCookies(res);
    return json(res, 200, { ok: true });
}
