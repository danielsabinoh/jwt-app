import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Table } from './shared';

const sections = {
    categories: { title: 'Categorias', fields: [['name', 'Nome'], ['description', 'Descrição']] },
    authors: { title: 'Autores', fields: [['name', 'Nome'], ['nationality', 'Nacionalidade'], ['birthDate', 'Nascimento', 'date']] },
    books: { title: 'Livros', fields: [['title', 'Título'], ['isbn', 'ISBN'], ['year', 'Ano', 'number'], ['totalCopies', 'Total de exemplares', 'number']] },
    readers: { title: 'Leitores', fields: [['name', 'Nome'], ['cpf', 'CPF'], ['email', 'E-mail', 'email'], ['phone', 'Telefone', 'tel']] },
    user: { title: 'Atendentes', fields: [['name', 'Nome'], ['username', 'Usuário'], ['email', 'E-mail', 'email'], ['password', 'Senha', 'password']] }
};

function Options({ rows, blank }) {
    return <>{blank && <option value="">{blank}</option>}{rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</>;
}

function BookFilters({ categories, authors, onSearch }) {
    function submit(event) {
        event.preventDefault();
        onSearch(new URLSearchParams(new FormData(event.currentTarget)).toString());
    }

    return <form className="panel fields" onSubmit={submit}>
        <label>Título<input name="title" placeholder="Buscar por título" /></label>
        <label>Categoria<select name="categoryId"><Options rows={categories} blank="Todas" /></select></label>
        <label>Autor<select name="authorId"><Options rows={authors} blank="Todos" /></select></label>
        <label className="checkbox"><input type="checkbox" name="available" value="true" /> Somente disponíveis</label>
        <button>Buscar</button>
    </form>;
}

function RecordForm({ fields, row, resource, categories, authors, onSave, onCancel, busy }) {
    function submit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const body = {};
        for (const [name, , type] of fields) {
            const value = form.get(name);
            if (name === 'password' && row.id && !value) continue;
            body[name] = type === 'number' ? Number(value) : value;
        }
        if (resource === 'books') {
            body.categoryId = Number(form.get('categoryId'));
            body.authorIds = form.getAll('authorIds').map(Number);
        }
        onSave(body);
    }

    return <form className="panel" onSubmit={submit}>
        <h2>{row.id ? 'Editar cadastro' : 'Novo cadastro'}</h2>
        <div className="fields">
            {fields.map(([name, label, type]) => <label key={name}>{label}
                <input name={name} type={type || 'text'} defaultValue={row[name] ?? ''}
                    required={name !== 'password' || !row.id} min={type === 'number' ? 1 : undefined}
                    minLength={name === 'password' ? 6 : undefined} />
            </label>)}
            {resource === 'books' && <>
                <label>Categoria<select name="categoryId" required defaultValue={row.categoryId || ''}><Options rows={categories} blank="Selecione" /></select></label>
                <label>Autores<select name="authorIds" multiple required defaultValue={(row.Authors || []).map(author => String(author.id))}><Options rows={authors} /></select>
                    <small>Use Ctrl para selecionar vários autores.</small></label>
            </>}
        </div>
        <div className="actions"><button disabled={busy}>Salvar</button><button type="button" onClick={onCancel}>Cancelar</button></div>
    </form>;
}

export function Catalog({ resource, isAdmin, onHistory }) {
    const { title, fields } = sections[resource];
    const [rows, setRows] = useState([]);
    const [categories, setCategories] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [draft, setDraft] = useState(null);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const path = '/' + resource;
    const canEdit = isAdmin || resource === 'readers';
    const canDelete = ['categories', 'authors', 'books'].includes(resource);

    const load = useCallback(async () => {
        setRows(await api(path + (query ? '?' + query : '')));
    }, [path, query]);

    useEffect(() => {
        Promise.resolve().then(load).catch(error => setError(error.message));
    }, [load]);

    useEffect(() => {
        if (resource !== 'books') return;
        Promise.all([api('/categories'), api('/authors')]).then(([categories, authors]) => {
            setCategories(categories);
            setAuthors(authors);
        }).catch(error => setError(error.message));
    }, [resource]);

    async function change(action) {
        setError('');
        setBusy(true);
        try {
            await action();
            await load();
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    const columns = fields.filter(([key]) => key !== 'password').map(([key, label]) => [label, row => row[key]]);
    if (resource === 'books') columns.push(
        ['Disponíveis', row => row.availableCopies],
        ['Categoria', row => row.Category?.name],
        ['Autores', row => row.Authors.map(author => author.name).join(', ')]
    );
    if (resource === 'user') columns.push(['Situação', row => row.active ? 'Ativo' : 'Desativado']);

    return <>
        <div className="section-heading"><h1>{title}</h1>{canEdit && <button onClick={() => setDraft({})}>Novo cadastro</button>}</div>
        {error && <p role="alert" className="error">{error}</p>}
        {resource === 'books' && <BookFilters categories={categories} authors={authors} onSearch={setQuery} />}
        {draft && <RecordForm key={draft.id || 'new'} row={draft} fields={fields} resource={resource}
            categories={categories} authors={authors} busy={busy} onCancel={() => setDraft(null)}
            onSave={body => change(async () => {
                await api(draft.id ? path + '/' + draft.id : path, { method: draft.id ? 'PUT' : 'POST', body });
                setDraft(null);
            })} />}
        <section className="panel"><Table columns={columns} rows={resource === 'user' ? rows.filter(row => !row.isAdmin) : rows} actions={canEdit ? row => <>
            <button disabled={busy} onClick={() => setDraft(row)}>Editar</button>
            {canDelete && <button disabled={busy} onClick={() => {
                if (window.confirm('Excluir este cadastro?')) change(() => api(path + '/' + row.id, { method: 'DELETE' }));
            }}>Excluir</button>}
            {resource === 'readers' && <button onClick={() => onHistory(row)}>Histórico</button>}
            {resource === 'user' && <button disabled={busy} onClick={() => change(() => api(path + '/' + row.id + '/active', {
                method: 'PATCH', body: { active: !row.active }
            }))}>{row.active ? 'Desativar' : 'Ativar'}</button>}
        </> : null} /></section>
    </>;
}

