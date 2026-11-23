export function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function Table({ columns, rows, actions }) {
    if (!rows.length) return <p className="muted">Nenhum registro encontrado.</p>;

    return <div className="table-wrap"><table>
        <thead><tr>{columns.map(([label]) => <th key={label} scope="col">{label}</th>)}{actions && <th scope="col">Ações</th>}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
            {columns.map(([label, get]) => <td key={label}>{get(row)}</td>)}
            {actions && <td><div className="actions">{actions(row)}</div></td>}
        </tr>)}</tbody>
    </table></div>;
}
