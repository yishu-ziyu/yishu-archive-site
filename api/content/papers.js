import {
    getErrorMessage,
    getSessionFromCookies,
    json,
    methodNotAllowed,
    readJsonBody,
    requestSupabase,
} from '../_utils/supabaseProxy.js';

function readId(req) {
    const rawId = req.query?.id;
    if (Array.isArray(rawId)) {
        return rawId[0] || '';
    }
    return typeof rawId === 'string' ? rawId : '';
}

async function requireAdmin(req, res) {
    const session = await getSessionFromCookies(req, res, { requireAdmin: true });
    if (!session) {
        json(res, 401, { error: '未登录或权限不足。' });
        return null;
    }
    return session;
}

function normalizeStatus(status) {
    return status === 'draft' ? 'draft' : 'published';
}

function buildPaperInsertPayload(body) {
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

function buildPaperUpdatePayload(body) {
    const payload = {
        updated_at: new Date().toISOString(),
    };

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

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const includeDrafts = req.query?.includeDrafts === '1' || req.query?.includeDrafts === 'true';
            const session = includeDrafts ? await requireAdmin(req, res) : null;
            if (includeDrafts && !session) {
                return;
            }

            const params = new URLSearchParams({
                select: '*',
                order: 'created_at.desc',
            });
            if (!includeDrafts) {
                params.set('status', 'eq.published');
            }

            const result = await requestSupabase({
                path: `papers?${params.toString()}`,
                method: 'GET',
                accessToken: session?.accessToken,
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '获取研究失败') });
            }

            return json(res, 200, { data: Array.isArray(result.data) ? result.data : [] });
        } catch (error) {
            return json(res, 500, {
                error: `获取研究异常：${error instanceof Error ? error.message : '未知错误'}`,
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const session = await requireAdmin(req, res);
            if (!session) {
                return;
            }

            const body = readJsonBody(req);
            const payload = buildPaperInsertPayload(body);
            if (!payload.title || !payload.abstract || !payload.journal) {
                return json(res, 400, { error: '研究标题、摘要、来源不能为空。' });
            }

            const result = await requestSupabase({
                path: 'papers?select=*',
                method: 'POST',
                accessToken: session.accessToken,
                body: payload,
                extraHeaders: {
                    Prefer: 'return=representation',
                },
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '创建研究失败') });
            }

            const created = Array.isArray(result.data) ? result.data[0] : null;
            if (!created) {
                return json(res, 500, { error: '创建研究失败：未返回数据。' });
            }

            return json(res, 200, { data: created });
        } catch (error) {
            return json(res, 500, {
                error: `创建研究异常：${error instanceof Error ? error.message : '未知错误'}`,
            });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const session = await requireAdmin(req, res);
            if (!session) {
                return;
            }

            const id = readId(req);
            if (!id) {
                return json(res, 400, { error: '缺少研究 id。' });
            }

            const body = readJsonBody(req);
            const payload = buildPaperUpdatePayload(body);
            const params = new URLSearchParams({
                id: `eq.${id}`,
                select: '*',
            });

            const result = await requestSupabase({
                path: `papers?${params.toString()}`,
                method: 'PATCH',
                accessToken: session.accessToken,
                body: payload,
                extraHeaders: {
                    Prefer: 'return=representation',
                },
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '更新研究失败') });
            }

            const updated = Array.isArray(result.data) ? result.data[0] : null;
            if (!updated) {
                return json(res, 404, { error: '更新研究失败：未找到对应记录。' });
            }

            return json(res, 200, { data: updated });
        } catch (error) {
            return json(res, 500, {
                error: `更新研究异常：${error instanceof Error ? error.message : '未知错误'}`,
            });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const session = await requireAdmin(req, res);
            if (!session) {
                return;
            }

            const id = readId(req);
            if (!id) {
                return json(res, 400, { error: '缺少研究 id。' });
            }

            const params = new URLSearchParams({
                id: `eq.${id}`,
            });

            const result = await requestSupabase({
                path: `papers?${params.toString()}`,
                method: 'DELETE',
                accessToken: session.accessToken,
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '删除研究失败') });
            }

            return json(res, 200, { ok: true });
        } catch (error) {
            return json(res, 500, {
                error: `删除研究异常：${error instanceof Error ? error.message : '未知错误'}`,
            });
        }
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
}
