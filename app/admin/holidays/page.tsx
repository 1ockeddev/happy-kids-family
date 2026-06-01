'use client';
import React, { useState, useEffect, useCallback } from 'react';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

interface Holiday {
  id: string;
  date: string;
  name_th: string;
  name_en?: string;
  type: 'public' | 'school' | 'weekend';
  cohort_id?: string;
}

interface Cohort {
  id: string;
  name: string;
}

export default function HolidaysPage() {
  const [data, setData] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ date: '', name_th: '', name_en: '', type: 'public', cohort_id: '' });
  const [saving, setSaving] = useState(false);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    // Load cohorts for dropdown
    fetch('/api/cohorts')
      .then(r => r.json())
      .then(j => setCohorts(j.data ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/holidays');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'เกิดข้อผิดพลาด');
      setData(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        modal === 'add' ? '/api/holidays' : `/api/holidays/${selected!.id}`,
        {
          method: modal === 'add' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ');
      setModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/holidays/${selected!.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ลบไม่สำเร็จ');
      setModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const typeLabels: Record<string, string> = {
    public: '🏛️ วันหยุดราชการ',
    school: '🏫 วันหยุดโรงเรียน',
    weekend: '📅 วันหยุดสุดสัปดาห์'
  };

  const filteredData = data.filter(h => {
    const searchLower = search.toLowerCase();
    
    // Search in name_th and name_en
    if (h.name_th.toLowerCase().includes(searchLower)) return true;
    if (h.name_en?.toLowerCase().includes(searchLower)) return true;
    
    // Search in date (YYYY-MM-DD format)
    if (h.date.includes(search)) return true;
    
    // Search in formatted Thai date
    const thaiDate = new Date(h.date).toLocaleDateString('th-TH', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    if (thaiDate.toLowerCase().includes(searchLower)) return true;
    
    // Search by year (both Buddhist and Gregorian)
    const year = new Date(h.date).getFullYear();
    const buddhistYear = year + 543;
    if (year.toString().includes(search)) return true;
    if (buddhistYear.toString().includes(search)) return true;
    
    return false;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          📅 จัดการวันหยุด
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          กำหนดวันหยุดราชการ วันหยุดโรงเรียน และวันปิดทำการ
        </p>
      </div>

      <div style={{
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px'
      }}>
        <div style={{ fontSize: '1.5rem' }}>💡</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
            คำแนะนำ
          </h3>
          <ul style={{ fontSize: '0.8rem', color: '#78350f', margin: 0, paddingLeft: '20px' }}>
            <li>วันหยุดที่เลือก "ทุกห้อง" จะใช้กับทุกห้องเรียน</li>
            <li>วันหยุดที่เลือกห้องเฉพาะจะใช้เฉพาะห้องนั้น</li>
            <li>วันหยุดจะไม่แสดงในกราฟสรุปการเข้าเรียน</li>
            <li>ระบบได้เพิ่มวันหยุดราชการปี 2025 ไว้ให้แล้ว</li>
          </ul>
        </div>
      </div>

      <CrudTable<Holiday>
        title="วันหยุด"
        columns={[
          {
            key: 'date',
            label: 'วันที่',
            render: h => new Date(h.date).toLocaleDateString('th-TH', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })
          },
          { key: 'name_th', label: 'ชื่อวันหยุด (ไทย)' },
          { key: 'name_en', label: 'ชื่อวันหยุด (อังกฤษ)', hideOnMobile: true },
          {
            key: 'type',
            label: 'ประเภท',
            render: h => <span className="badge badge-teacher">{typeLabels[h.type]}</span>
          },
          {
            key: 'cohort_id',
            label: 'ห้องเรียน',
            render: h => {
              if (!h.cohort_id) return <span style={{color:'#94a3b8',fontStyle:'italic'}}>ทุกห้อง</span>;
              const cohort = cohorts.find(c => c.id === h.cohort_id);
              return cohort?.name || h.cohort_id;
            }
          }
        ]}
        data={filteredData}
        loading={loading}
        error={error}
        onRefresh={load}
        onAdd={() => {
          setForm({ date: '', name_th: '', name_en: '', type: 'public', cohort_id: '' });
          setModal('add');
        }}
        addLabel="เพิ่มวันหยุด"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาวันหยุด..."
        actions={row => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelected(row);
                setForm({
                  date: row.date,
                  name_th: row.name_th,
                  name_en: row.name_en || '',
                  type: row.type,
                  cohort_id: row.cohort_id || ''
                });
                setModal('edit');
              }}
            >
              <Pencil size={13} /> แก้ไข
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                setSelected(row);
                setModal('delete');
              }}
            >
              <Trash2 size={13} /> ลบ
            </button>
          </div>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'เพิ่มวันหยุดใหม่' : 'แก้ไขวันหยุด'}
        onClose={() => setModal(null)}
        onConfirm={handleSave}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        <div className="form-group">
          <label className="form-label">วันที่</label>
          <input
            className="form-input"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">ชื่อวันหยุด (ไทย)</label>
          <input
            className="form-input"
            value={form.name_th}
            onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
            placeholder="เช่น วันขึ้นปีใหม่"
          />
        </div>
        <div className="form-group">
          <label className="form-label">ชื่อวันหยุด (อังกฤษ)</label>
          <input
            className="form-input"
            value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            placeholder="เช่น New Year's Day"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">ประเภท</label>
            <select
              className="form-input"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
            >
              <option value="public">🏛️ วันหยุดราชการ</option>
              <option value="school">🏫 วันหยุดโรงเรียน</option>
              <option value="weekend">📅 วันหยุดสุดสัปดาห์</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ห้องเรียน</label>
            <select
              className="form-input"
              value={form.cohort_id}
              onChange={e => setForm(f => ({ ...f, cohort_id: e.target.value }))}
            >
              <option value="">ทุกห้อง</option>
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'delete'}
        title="ยืนยันการลบ"
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'}
        confirmDanger
      >
        <p style={{ color: '#6B7280' }}>
          คุณต้องการลบวันหยุด <strong>{selected?.name_th}</strong> ({selected?.date})?
        </p>
      </Modal>
    </div>
  );
}
