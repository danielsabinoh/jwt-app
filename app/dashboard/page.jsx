'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, logout, session } from '../../lib/api';
import { Catalog } from './catalog';
import { Loans, LoanTable } from './loans';
import { money } from './shared';

const menu = [
    ['dashboard', 'Dashboard', true],
    ['books', 'Livros'],
    ['categories', 'Categorias', true],
    ['authors', 'Autores', true],
    ['readers', 'Leitores'],
    ['loans', 'Empréstimos'],
    ['user', 'Atendentes', true]
];

function Reports() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const load = useCallback(() => api('/reports/dashboard').then(setData).catch(error => setError(error.message)), []);

    useEffect(() => { load(); }, [load]);

    return <>
        <div className="section-heading"><h1>Dashboard</h1><button onClick={load}>Atualizar</button></div>
        {error && <p role="alert" className="error">{error}</p>}
        {data && <div className="cards">
            {[
                ['Total de livros', data.totalBooks],
                ['Empréstimos ativos', data.active],
                ['Empréstimos atrasados', data.late],
                ['Multas registradas', money(data.fines)]
            ].map(([label, value]) => <article className="panel" key={label}><span>{label}</span><strong>{value}</strong></article>)}
        </div>}
    </>;
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('');
    const [error, setError] = useState('');
    const [history, setHistory] = useState(null);

    useEffect(() => {
        if (!session()) {
            router.replace('/');
            return;
        }
        api('/auth/me').then(data => {
            setUser(data);
            setTab(data.isAdmin ? 'dashboard' : 'books');
        }).catch(error => setError(error.message));
    }, [router]);

    async function signOut() {
        setError('');
        try {
            await logout();
            router.replace('/');
        } catch (error) {
            setError(error.message);
        }
    }

    async function showHistory(reader) {
        setError('');
        try {
            setHistory({ name: reader.name, loans: await api('/readers/' + reader.id + '/loans') });
        } catch (error) {
            setError(error.message);
        }
    }

    if (!user) return <main className="content">{error || 'Verificando sessão…'}</main>;

    return <>
        <header className="topbar"><strong>Biblioteca</strong><div><span>{user.name}</span><button onClick={signOut}>Sair</button></div></header>
        <main className="content">
            <nav aria-label="Seções">{menu.filter(([, , admin]) => !admin || user.isAdmin).map(([id, label]) =>
                <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => {
                    setTab(id);
                    setHistory(null);
                    setError('');
                }}>{label}</button>
            )}</nav>
            {error && <p role="alert" className="error">{error}</p>}
            {tab === 'dashboard' && <Reports />}
            {tab === 'loans' && <Loans />}
            {tab && !['dashboard', 'loans'].includes(tab) && <Catalog key={tab} resource={tab} isAdmin={user.isAdmin} onHistory={showHistory} />}
            {tab === 'readers' && history && <section className="panel">
                <div className="section-heading"><h2>Histórico de {history.name}</h2><button onClick={() => setHistory(null)}>Fechar</button></div>
                <LoanTable loans={history.loans} />
            </section>}
        </main>
    </>;
}
