import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
}

export default function DataTable<T extends Record<string, any>>({
  data, columns, keyExtractor, searchKeys = [], pageSize = 8,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(row => searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, query, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const handleSearch = (v: string) => { setQuery(v); setPage(1); };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="search-bar input-group">
          <span className="input-group-text bg-white" style={{ border: '1px solid #d1d5db', borderRight: 'none' }}>
            <Search size={14} className="text-muted" />
          </span>
          <input
            type="text" className="form-control" placeholder="Search..."
            value={query} onChange={e => handleSearch(e.target.value)}
            style={{ borderLeft: 'none' }}
          />
        </div>
        <small className="text-muted">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</small>
      </div>

      <div className="table-responsive">
        <table className="table ssmts-table mb-0">
          <thead>
            <tr>{columns.map(col => <th key={col.key}>{col.header}</th>)}</tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={columns.length} className="text-center text-muted py-4">No records found.</td></tr>
              : paginated.map(row => (
                  <tr key={keyExtractor(row)}>
                    {columns.map(col => (
                      <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Page {page} of {totalPages}</small>
          <div className="d-flex gap-1">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${p === page ? 'btn-amber' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
