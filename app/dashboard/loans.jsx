import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { money, Table } from './shared';

const columns = [
    ['Livro', row => row.Book?.title],
    ['Leitor', row => row.Reader?.name],
    ['Empréstimo', row => row.loanDate.split('-').reverse().join('/')],
    ['Prazo', row => row.dueDate.split('-').reverse().join('/')],
    ['Devolução', row => row.returnDate?.split('-').reverse().join('/') || '—'],
    ['Status', row => row.status],
    ['Multa', row => money(row.fine)]
];

export function LoanTable({ loans, onReturn }) {
    return <Table columns={columns} rows={loans} actions={onReturn ? row => row.status !== 'DEVOLVIDO' &&
        <button onClick={() => onReturn(row.id)}>Devolver</button> : null} />;
}

function SearchSelect({ name, label, options }) {
    const [query, setQuery] = useState('');
    const filtered = options.filter(option => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return <div>
        <label>Buscar {label}<input value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label>Selecionar {label}<select name={name} required defaultValue="">
            <option value="">Selecione</option>
            {filtered.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select></label>
    </div>;
}

export function Loans() {
    const [loans, setLoans] = useState([]);
    const [readers, setReaders] = useState([]);
    const [books, setBooks] = useState([]);
    const [status, setStatus] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const [loans, readers, books] = await Promise.all([
            api('/loans' + (status ? '?status=' + status : '')),
            api('/readers'),
            api('/books?available=true')
        ]);
        setLoans(loans);
        setReaders(readers);
        setBooks(books);
    }, [status]);

    useEffect(() => { Promise.resolve().then(load).catch(error => setError(error.message)); }, [load]);

    async function change(action) {
        if (busy) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            setNotice(await action());
            await load();
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    function create(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        change(async () => {
            await api('/loans', {
                method: 'POST', body: { bookId: Number(form.get('bookId')), readerId: Number(form.get('readerId')) }
            });
            return 'Empréstimo registrado.';
        });
    }

    function returnBook(id) {
        change(async () => {
            const loan = await api('/loans/' + id + '/return', { method: 'PATCH' });
            return 'Devolução registrada. Multa: ' + money(loan.fine) + '.';
        });
    }

    return <>
        <h1>Empréstimos</h1>
        {notice && <p role="status" className="notice">{notice}</p>}
        {error && <p role="alert" className="error">{error}</p>}
        <form className="panel" onSubmit={create}>
            <h2>Novo empréstimo</h2>
            <div className="fields">
                <SearchSelect name="readerId" label="leitor" options={readers.map(row => ({ id: row.id, label: row.name + ' · ' + row.cpf }))} />
                <SearchSelect name="bookId" label="livro" options={books.map(row => ({ id: row.id, label: row.title + ' · ' + row.availableCopies + ' disponíveis' }))} />
            </div>
            <button disabled={busy}>Registrar empréstimo</button>
        </form>
        <section className="panel">
            <label>Filtrar por status<select value={status} onChange={event => setStatus(event.target.value)}>
                <option value="">Todos</option><option>ATIVO</option><option>ATRASADO</option><option>DEVOLVIDO</option>
            </select></label>
            <LoanTable loans={loans} onReturn={returnBook} />
        </section>
    </>;
}

