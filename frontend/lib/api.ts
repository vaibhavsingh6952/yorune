const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
}

// CSRF double-submit: Spring Security sets a readable XSRF-TOKEN cookie and
// requires its value echoed in the X-XSRF-TOKEN header on mutating requests.
// Bootstrap it once (GET /auth/csrf forces generation + Set-Cookie), then reuse.
export async function ensureCsrfToken(): Promise<string | null> {
    let token = readCookie('XSRF-TOKEN')
    if (!token) {
        try {
            await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
            token = readCookie('XSRF-TOKEN')
        } catch {
            // Network/CORS problems surface on the actual request instead
        }
    }
    return token
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };

    const method = (options.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const xsrf = await ensureCsrfToken();
        if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    })

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'API request failed');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
