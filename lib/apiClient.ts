export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
    };

    const response = await fetch(path, {
        credentials: 'include',
        ...init,
        headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        if (typeof payload === 'object' && payload && ('error' in payload || 'message' in payload)) {
            const message = String((payload as Record<string, unknown>).error || (payload as Record<string, unknown>).message);
            throw new Error(message);
        }
        throw new Error(typeof payload === 'string' ? payload : `请求失败（${response.status}）`);
    }

    return payload as T;
}
