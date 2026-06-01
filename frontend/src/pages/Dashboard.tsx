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

  // Load this tenant's records on mount.
  useEffect(() => {
    dispatch(fetchRecords({ limit: 100, offset: 0 }));
  }, [dispatch]);

  // Local filtering, recomputed only when data or debounced term changes.
  const filteredRecords = useMemo(() => {
    const term = debouncedFilter.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => r.name.toLowerCase().includes(term));
  }, [items, debouncedFilter]);

  function handleLogout() {
    // Global reset: wipe ALL tenant data from memory, then go to /login.
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
    <div className="container">
      <header className="topbar">
        <div>
          <h1>{tenant?.name}</h1>
          <span className="muted">
            {user?.email} · <strong>{user?.role}</strong> · tenant: {tenant?.slug}
          </span>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {isAdmin && (
        <form className="card inline" onSubmit={handleCreate}>
          <strong>New record (ADMIN only)</strong>
          <input
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input
            placeholder="Amount"
            type="number"
            step="0.01"
            min="0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search"
          placeholder="Filter by name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="muted">
          Showing {filteredRecords.length} of {pagination.total}
        </span>
      </div>

      {status === 'loading' && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <RecordsTable records={filteredRecords} />
    </div>
  );
}
