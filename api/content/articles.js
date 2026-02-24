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

function buildArticleInsertPayload(body) {
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

function buildArticleUpdatePayload(body) {
    const payload = {
        updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.excerpt !== undefined) payload.excerpt = body.excerpt ? String(body.excerpt) : null;
    if (body.content !== undefined) payload.content = String(body.content);
    if (body.pdfUrl !== undefined) payload.pdf_url = body.pdfUrl ? String(body.pdfUrl) : null;
    if (body.externalUrl !== undefined) payload.external_url = body.externalUrl ? String(body.externalUrl) : null;
    if (body.tags !== undefined) payload.tags = Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : [];
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
                path: `articles?${params.toString()}`,
                method: 'GET',
                accessToken: session?.accessToken,
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '获取文章失败') });
            }

            return json(res, 200, { data: Array.isArray(result.data) ? result.data : [] });
        } catch (error) {
            return json(res, 500, {
                error: `获取文章异常：${error instanceof Error ? error.message : '未知错误'}`,
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
            const payload = buildArticleInsertPayload(body);
            if (!payload.title || !payload.content) {
                return json(res, 400, { error: '文章标题和内容不能为空。' });
            }

            const result = await requestSupabase({
                path: 'articles?select=*',
                method: 'POST',
                accessToken: session.accessToken,
                body: payload,
                extraHeaders: {
                    Prefer: 'return=representation',
                },
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '创建文章失败') });
            }

            const created = Array.isArray(result.data) ? result.data[0] : null;
            if (!created) {
                return json(res, 500, { error: '创建文章失败：未返回数据。' });
            }

            return json(res, 200, { data: created });
        } catch (error) {
            return json(res, 500, {
                error: `创建文章异常：${error instanceof Error ? error.message : '未知错误'}`,
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
                return json(res, 400, { error: '缺少文章 id。' });
            }

            const body = readJsonBody(req);
            const payload = buildArticleUpdatePayload(body);

            const params = new URLSearchParams({
                id: `eq.${id}`,
                select: '*',
            });

            const result = await requestSupabase({
                path: `articles?${params.toString()}`,
                method: 'PATCH',
                accessToken: session.accessToken,
                body: payload,
                extraHeaders: {
                    Prefer: 'return=representation',
                },
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '更新文章失败') });
            }

            const updated = Array.isArray(result.data) ? result.data[0] : null;
            if (!updated) {
                return json(res, 404, { error: '更新文章失败：未找到对应记录。' });
            }

            return json(res, 200, { data: updated });
        } catch (error) {
            return json(res, 500, {
                error: `更新文章异常：${error instanceof Error ? error.message : '未知错误'}`,
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
                return json(res, 400, { error: '缺少文章 id。' });
            }

            const params = new URLSearchParams({
                id: `eq.${id}`,
            });

            const result = await requestSupabase({
                path: `articles?${params.toString()}`,
                method: 'DELETE',
                accessToken: session.accessToken,
            });

            if (!result.ok) {
                return json(res, result.status, { error: getErrorMessage(result, '删除文章失败') });
            }

            return json(res, 200, { ok: true });
        } catch (error) {
            return json(res, 500, {
                error: `删除文章异常：${error instanceof Error ? error.message : '未知错误'}`,
            });
        }
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
}
