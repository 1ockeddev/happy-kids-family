'use client';
import { ReactNode } from 'react';
import { Search, Plus, RefreshCw, AlertCircle } from 'lucide-react';

interface Column<T> {
  key: string; label: string; render?: (row: T) => ReactNode; hideOnMobile?: boolean;
}
interface CrudTableProps<T> {
  title: string; description?: string;
  columns: Column<T>[]; data: T[];
  loading?: boolean; error?: string | null; onRefresh?: () => void;
  onAdd?: () => void; addLabel?: string;
  searchValue?: string; onSearchChange?: (v: string) => void; searchPlaceholder?: string;
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
      {/* ── Page header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Prompt, sans-serif', lineHeight: 1.2 }}>{title}</h1>
            {description && <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>{description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onRefresh && (
              <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
            {onAdd && (
              <button className="btn btn-primary btn-sm" onClick={onAdd}>
                <Plus size={14} /> {addLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="page-body">
        {/* Search */}
        {onSearchChange && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input type="text" className="form-input" placeholder={searchPlaceholder} value={searchValue}
              onChange={e => onSearchChange(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FDECEC', borderRadius: 8, color: '#E85C5C', marginBottom: 12, fontSize: 13 }}>
            <AlertCircle size={14} /> <span>{error}</span>
            {onRefresh && <button onClick={onRefresh} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E85C5C', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>ลองใหม่</button>}
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className={col.hideOnMobile ? 'hide-mobile' : ''}>{col.label}</th>
                  ))}
                  {actions && <th style={{ textAlign: 'right' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col.key} className={col.hideOnMobile ? 'hide-mobile' : ''}>
                          <div style={{ height: 14, background: '#F3F4F6', borderRadius: 4, width: '70%', animation: 'pulse 1.5s infinite' }} />
                        </td>
                      ))}
                      {actions && <td />}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '36px 20px', color: '#9CA3AF', fontSize: 14 }}>
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => (
                      <td key={col.key} className={col.hideOnMobile ? 'hide-mobile' : ''}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                    {actions && <td style={{ textAlign: 'right' }}>{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', color: '#9CA3AF', fontSize: 12 }}>
            {loading ? 'กำลังโหลด...' : `ทั้งหมด ${data.length} รายการ`}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .hide-mobile { display: none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}
