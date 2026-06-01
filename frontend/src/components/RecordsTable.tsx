import { memo } from 'react';
import type { RecordItem } from '../features/records/recordsSlice';

interface Props {
  records: RecordItem[];
}

// Formato de moneda en pesos colombianos.
const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Tabla presentacional pura. Envuelta en React.memo para que solo se vuelva a
 * renderizar cuando cambia la referencia de `records`, no en cada tecla del
 * filtro del componente padre.
 */
function RecordsTableBase({ records }: Props) {
  if (records.length === 0) {
    return <p className="empty">No hay registros que coincidan con el filtro.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="records">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th className="num">Monto</th>
            <th>Fecha de creación</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td className="muted">{r.id}</td>
              <td>{r.name}</td>
              <td className={`num ${Number(r.amount) < 0 ? 'negative' : ''}`}>
                {currency.format(Number(r.amount))}
              </td>
              <td className="muted">{dateFmt.format(new Date(r.created_at))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(RecordsTableBase);
