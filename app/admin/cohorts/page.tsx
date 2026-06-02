'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cohortsApi } from '@/lib/api-client';
import { Cohort } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2, Users } from 'lucide-react';

/* ─── Helper: Parse date as local ── */
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  return new Date(dateStr);
};

/* ─── Helper: Format date as YYYY-MM-DD ── */
const formatDateForInput = (dateStr: string | Date): string => {
  if (!dateStr) return '';
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : '';
};

export default function CohortsPage() {
  const router = useRouter();
  const [data, setData]     = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Cohort | null>(null);
  const [form, setForm]     = useState({ name: '', level: '', academic_year: new Date().getFullYear(), start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await cohortsApi.list(search) as Cohort[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      modal === 'add' ? await cohortsApi.create(form) : await cohortsApi.update(selected!.id, form);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <CrudTable<Cohort>
        title="ห้องเรียน / รุ่น"
        description="คลิกที่ชื่อห้องเรียนเพื่อจัดการนักเรียนในรุ่นนั้น"
        columns={[
          {
            key: 'name', label: 'ชื่อห้องเรียน',
            render: r => (
              <button
                onClick={() => router.push(`/admin/cohorts/${r.id}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {r.start_date && parseLocalDate(r.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {r.end_date && parseLocalDate(r.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
              </button>
            ),
          },
          { key: 'level', label: 'ระดับชั้น', render: r => <span className="badge badge-teacher">{r.level}</span> },
          { key: 'academic_year', label: 'ปีการศึกษา' },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm({ name: '', level: '', academic_year: new Date().getFullYear(), start_date: '', end_date: '' }); setModal('add'); }}
        addLabel="เพิ่มห้องเรียน"
        searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาห้องเรียน..."
        actions={row => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#4A90B8', borderColor: '#4A90B8' }}
              onClick={() => router.push(`/admin/cohorts/${row.id}`)}
            >
              <Users size={13} /> นักเรียน
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setSelected(row);
              setForm({ 
                name: row.name ?? '', 
                level: row.level ?? '', 
                academic_year: row.academic_year ?? new Date().getFullYear(), 
                start_date: formatDateForInput(row.start_date), 
                end_date: formatDateForInput(row.end_date) 
              });
              setModal('edit');
            }}>
              <Pencil size={13} /> แก้ไข
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}>
              <Trash2 size={13} /> ลบ
            </button>
          </div>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'เพิ่มห้องเรียนใหม่' : 'แก้ไขห้องเรียน'}
        onClose={() => setModal(null)}
        onConfirm={handleSave}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        <div className="form-group">
          <label className="form-label">ชื่อห้องเรียน</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น Sunflower Class" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">ระดับชั้น</label>
            <select className="form-input" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              <option value="">เลือก...</option>
              <option value="K1">K1</option>
              <option value="K2">K2</option>
              <option value="K3">K3</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ปีการศึกษา</label>
            <input className="form-input" type="number" value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: parseInt(e.target.value) }))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">วันเริ่มต้น</label>
            <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">วันสิ้นสุด</label>
            <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'delete'} title="ยืนยันการลบ"
        onClose={() => setModal(null)}
        onConfirm={async () => { setSaving(true); try { await cohortsApi.delete(selected!.id); setModal(null); load(); } finally { setSaving(false); } }}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger
      >
        <p style={{ color: '#6B7280' }}>คุณต้องการลบห้องเรียน <strong>{selected?.name}</strong>?</p>
      </Modal>
    </>
  );
}
