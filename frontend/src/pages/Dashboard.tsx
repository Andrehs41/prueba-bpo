import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchRecords, createRecord } from '../features/records/recordsSlice';
import { resetStore } from '../app/resetAction';
import { useDebounce } from '../hooks/useDebounce';
import RecordsTable from '../components/RecordsTable';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const tenant = useAppSelector((s) => s.tenant.current);
  const user = useAppSelector((s) => s.auth.user);
  const { items, status, error, pagination } = useAppSelector((s) => s.records);

  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 300);

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Cargar los registros del tenant al montar.
  useEffect(() => {
    dispatch(fetchRecords({ limit: 100, offset: 0 }));
  }, [dispatch]);

  // Filtrado local, recalculado solo cuando cambian los datos o el término.
  const filteredRecords = useMemo(() => {
    const term = debouncedFilter.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => r.name.toLowerCase().includes(term));
  }, [items, debouncedFilter]);

  function handleLogout() {
    // Reset global: borra TODOS los datos del tenant en memoria y vuelve a /login.
    dispatch(resetStore());
    navigate('/login');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const amount = Number(newAmount || 0);
    const result = await dispatch(createRecord({ name: newName.trim(), amount }));
    if (createRecord.fulfilled.match(result)) {
      setNewName('');
      setNewAmount('');
    }
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-info">
          <span className="brand-dot small" />
          <div>
            <h1>{tenant?.name}</h1>
            <span className="muted">
              {user?.email} · <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>{user?.role}</span>
            </span>
          </div>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <main className="container">
        {isAdmin && (
          <form className="panel create-form" onSubmit={handleCreate}>
            <strong className="panel-title">Nuevo registro</strong>
            <input
              placeholder="Nombre del registro"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              placeholder="Monto"
              type="number"
              step="0.01"
              min="0"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
            <button type="submit">Agregar</button>
          </form>
        )}

        <div className="toolbar">
          <input
            className="search"
            placeholder="Filtrar por nombre…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <span className="muted">
            Mostrando {filteredRecords.length} de {pagination.total} registros
          </span>
        </div>

        {status === 'loading' && <p className="muted">Cargando registros…</p>}
        {error && <p className="error">{error}</p>}

        <RecordsTable records={filteredRecords} />
      </main>
    </div>
  );
}
