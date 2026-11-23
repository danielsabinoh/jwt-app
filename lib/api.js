const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
const key = 'biblioteca-sessao';
let refreshPending;

export function session() {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

export function clearSession() {
    sessionStorage.removeItem(key);
}

async function request(path, options = {}, accessToken) {
    const headers = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
    const response = await fetch(baseURL + path, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw Object.assign(new Error(data?.message || 'Falha na requisição.'), { status: response.status });
    return data;
}

export async function login(body) {
    const data = await request('/auth/login', { method: 'POST', body });
    sessionStorage.setItem(key, JSON.stringify(data));
}

function expire() {
    clearSession();
    window.location.replace('/');
}

function renew(current) {
    if (!refreshPending) {
        refreshPending = request('/auth/refresh', {
            method: 'POST',
            body: { refreshToken: current.refreshToken }
        }).then(data => {
            sessionStorage.setItem(key, JSON.stringify(data));
            return data;
        }).catch(error => {
            if (error.status === 401) expire();
            throw error;
        }).finally(() => { refreshPending = undefined; });
    }
    return refreshPending;
}

export async function api(path, options) {
    const current = session();
    if (!current) {
        expire();
        throw new Error('Sessão encerrada.');
    }
    try {
        return await request(path, options, current.accessToken);
    } catch (error) {
        if (error.status !== 401) throw error;
    }

    const latest = session();
    if (!latest) throw new Error('Sessão encerrada.');
    const valid = latest.accessToken === current.accessToken ? await renew(latest) : latest;
    try {
        return await request(path, options, valid.accessToken);
    } catch (error) {
        if (error.status === 401) expire();
        throw error;
    }
}

export async function logout() {
    await api('/auth/me');
    const current = session();
    await request('/auth/logout', {
        method: 'POST',
        body: { refreshToken: current.refreshToken }
    }, current.accessToken);
    clearSession();
}
