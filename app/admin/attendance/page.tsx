'use client';
import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, dailyApi, childrenApi } from '@/lib/api-client';
import { Attendance, AttendanceStatus, Daily, Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

const statusOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'มาเรียน' }, { value: 'absent', label: 'ขาดเรียน' },
  { value: 'sick', label: 'ป่วย' }, { value: 'leave', label: 'ลา' },
];

export default function AttendancePage() {
  const [data, setData] = useState<Attendance[]>([]);
  const [dailies, setDailies] = useState<Daily[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Attendance | null>(null);
  const [form, setForm] = useState({ daily_id: '', child_id: '', status: 'present' as AttendanceStatus, note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await attendanceApi.list(search ? { search } : {}) as Attendance[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    dailyApi.list().then(r => setDailies(r as Daily[])).catch(() => {});
    childrenApi.list().then(r => setChildren(r as Child[])).catch(() => {});
  }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      modal === 'add' ? await attendanceApi.upsert(form) : await attendanceApi.update(selected!.id, form);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const statusLabels: Record<AttendanceStatus, string> = { present: 'มาเรียน', absent: 'ขาดเรียน', sick: 'ป่วย', leave: 'ลา' };

  return (
    <>
      <CrudTable<Attendance>
        title="การเข้าเรียน" description="บันทึกและจัดการสถานะการเข้าเรียนของนักเรียน"
        columns={[
          { key: 'child', label: 'นักเรียน', render: (r) => <div><div style={{ fontWeight: 500 }}>{(r.child as Child)?.name_th}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(r.child as Child)?.name_en}</div></div> },
          { key: 'status', label: 'สถานะ', render: (r) => <span className={`badge badge-${r.status}`}>{statusLabels[r.status]}</span> },
          { key: 'note', label: 'หมายเหตุ', render: (r) => r.note ?? <span style={{ color: 'var(--text-secondary)' }}>-</span> },
          { key: 'created_at', label: 'วันที่', render: (r) => new Date(r.created_at).toLocaleDateString('th-TH') },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm({ daily_id: dailies[0]?.id ?? '', child_id: '', status: 'present', note: '' }); setModal('add'); }}
        addLabel="บันทึกการเข้าเรียน" searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อนักเรียน..."
        actions={(row) => (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(row); setForm({ daily_id: row.daily_id, child_id: row.child_id, status: row.status, note: row.note ?? '' }); setModal('edit'); }}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'บันทึกการเข้าเรียน' : 'แก้ไขการเข้าเรียน'} onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        <div className="form-group"><label className="form-label">บันทึกประจำวัน</label>
          <select className="form-input" value={form.daily_id} onChange={e => setForm({ ...form, daily_id: e.target.value })}>
            <option value="">เลือกวัน...</option>
            {dailies.map(d => <option key={d.id} value={d.id}>{d.date}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">นักเรียน</label>
          <select className="form-input" value={form.child_id} onChange={e => setForm({ ...form, child_id: e.target.value })}>
            <option value="">เลือกนักเรียน...</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name_th}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">สถานะ</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {statusOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, status: opt.value })}
                className={`badge badge-${opt.value}`}
                style={{ cursor: 'pointer', border: form.status === opt.value ? '2px solid currentColor' : '2px solid transparent', padding: '6px 14px', fontSize: '13px' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="form-label">หมายเหตุ</label><input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
      </Modal>
      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={async () => { setSaving(true); try { await attendanceApi.delete(selected!.id); setModal(null); load(); } finally { setSaving(false); } }} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ลบบันทึกการเข้าเรียนของ <strong>{(selected?.child as Child)?.name_th}</strong>?</p>
      </Modal>
    </>
  );
}
