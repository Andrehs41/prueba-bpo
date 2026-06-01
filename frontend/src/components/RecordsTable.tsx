import { memo } from 'react';
import type { RecordItem } from '../features/records/recordsSlice';

interface Props {
  records: RecordItem[];
}

/**
 * Pure presentational table. Wrapped in React.memo so it only re-renders when
 * the `records` array reference actually changes - not on every keystroke in
 * the parent's filter input.
 */
function RecordsTableBase({ records }: Props) {
  if (records.length === 0) {
    return <p className="muted">No records match your filter.</p>;
  }

  return (
    <table className="records">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Amount</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.name}</td>
            <td>${Number(r.amount).toLocaleString()}</td>
            <td>{new Date(r.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default memo(RecordsTableBase);
