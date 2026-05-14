'use client';
import { ReactNode } from 'react';
import { Search, Plus, RefreshCw, AlertCircle } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface CrudTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: (row: T) => ReactNode;
}

export default function CrudTable<T extends { id: string }>({
  title, description, columns, data,
  loading, error, onRefresh,
  onAdd, addLabel = 'เพิ่มใหม่',
  searchValue, onSearchChange, searchPlaceholder = 'ค้นหา...',
  actions,
}: CrudTableProps<T>) {
  return (
    <>
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A2E', fontFamily: 'Prompt, sans-serif' }}>{title}</h1>
            {description && <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '2px' }}>{description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRefresh && (
              <button className="btn btn-ghost" onClick={onRefresh} title="รีเฟรช">
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
            {onAdd && (
              <button className="btn btn-primary" onClick={onAdd}>
                <Plus size={15} /> {addLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {onSearchChange && (
          <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input type="text" className="form-input" placeholder={searchPlaceholder} value={searchValue} onChange={e => onSearchChange(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FDECEC', borderRadius: '8px', color: '#E85C5C', marginBottom: '12px', fontSize: '14px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
            {onRefresh && <button onClick={onRefresh} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E85C5C', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>ลองใหม่</button>}
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {columns.map(col => <th key={col.key}>{col.label}</th>)}
                  {actions && <th style={{ textAlign: 'right' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col.key}>
                          <div style={{ height: 16, background: '#F3F4F6', borderRadius: 4, width: `${60 + Math.random() * 30}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                      {actions && <td />}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                    {actions && <td style={{ textAlign: 'right' }}>{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', color: '#9CA3AF', fontSize: '13px' }}>
            {loading ? 'กำลังโหลด...' : `ทั้งหมด ${data.length} รายการ`}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}
