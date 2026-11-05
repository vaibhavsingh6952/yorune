'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureCsrfToken } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault(); // stop the browser to refresh when a form is submitted
        setError('');

        try{
            const xsrf = await ensureCsrfToken();
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include', // required to store the HttpOnly auth cookie cross-origin
            });
            if(!res.ok) throw new Error('Invalid email or password');
            const data = await res.json();
            localStorage.setItem('token',data.token);
            router.push('/dashboard');
        }
        catch(err: any) {
            setError(err.message);
        }
    };
    return (
        <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Yorune</h1>
                {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg font-medium transition"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </main>
    );
}