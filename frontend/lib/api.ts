const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
        'Content-type': 'application/json',
        ...options.headers,
    };
    
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