'use client';
import { useState, useEffect, useCallback } from 'react';
import { dailyApi, cohortsApi } from '@/lib/api-client';
import { Daily, Cohort } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

export default function DailyPage() {
  const [data, setData] = useState<Daily[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Daily | null>(null);
  const [form, setForm] = useState({ cohort_id: '', date: '', activity: '', food: '', fruit: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await dailyApi.list(search ? { search } : {}) as Daily[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    cohortsApi.list().then(r => setCohorts(r as Cohort[])).catch(() => {});
  }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      modal === 'add' ? await dailyApi.create(form) : await dailyApi.update(selected!.id, form);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <CrudTable<Daily>
        title="บันทึกรายวัน" description="จัดการกิจกรรม อาหาร และข้อมูลประจำวัน"
        columns={[
          { key: 'date', label: 'วันที่', render: (r) => new Date(r.date).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
          { key: 'cohort', label: 'ห้องเรียน', render: (r) => <span className="badge badge-teacher">{(r.cohort as Cohort)?.name ?? '-'}</span> },
          { key: 'activity', label: 'กิจกรรม' },
          { key: 'food', label: 'อาหาร' },
          { key: 'fruit', label: 'ผลไม้' },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm({ cohort_id: '', date: new Date().toISOString().split('T')[0], activity: '', food: '', fruit: '', note: '' }); setModal('add'); }}
        addLabel="เพิ่มบันทึก" searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหา..."
        actions={(row) => (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(row); setForm({ cohort_id: row.cohort_id, date: row.date, activity: row.activity ?? '', food: row.food ?? '', fruit: row.fruit ?? '', note: row.note ?? '' }); setModal('edit'); }}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'เพิ่มบันทึกรายวัน' : 'แก้ไขบันทึกรายวัน'} onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group"><label className="form-label">ห้องเรียน</label>
            <select className="form-input" value={form.cohort_id} onChange={e => setForm({ ...form, cohort_id: e.target.value })}>
              <option value="">เลือกห้องเรียน...</option>
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">วันที่</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">กิจกรรมวันนี้</label><input className="form-input" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group"><label className="form-label">อาหารกลางวัน</label><input className="form-input" value={form.food} onChange={e => setForm({ ...form, food: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">ผลไม้</label><input className="form-input" value={form.fruit} onChange={e => setForm({ ...form, fruit: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">หมายเหตุ</label><textarea className="form-input" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ resize: 'vertical' }} /></div>
      </Modal>
      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={async () => { setSaving(true); try { await dailyApi.delete(selected!.id); setModal(null); load(); } finally { setSaving(false); } }} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ลบบันทึกวันที่ <strong>{selected?.date}</strong>?</p>
      </Modal>
    </>
  );
}
