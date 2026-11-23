'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/api';

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError('');
        setBusy(true);
        try {
            await login({ email: form.get('email'), password: form.get('password') });
            router.replace('/dashboard');
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    return <main className="login">
        <form className="panel" onSubmit={submit}>
            <h1>Biblioteca</h1>
            <p>Entre para acessar o sistema.</p>
            <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <p role="alert" className="error">{error}</p>}
            <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
    </main>;
}
