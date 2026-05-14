'use client';
import { useState, useEffect, useCallback } from 'react';
import { childrenApi } from '@/lib/api-client';
import { Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

export default function ChildrenPage() {
  const [data, setData] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Child | null>(null);
  const [form, setForm] = useState({ name_en: '', name_th: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await childrenApi.list(search) as Child[];
      setData(rows);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      modal === 'add' ? await childrenApi.create(form) : await childrenApi.update(selected!.id, form);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await childrenApi.delete(selected!.id); setModal(null); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <CrudTable<Child>
        title="นักเรียน" description="จัดการข้อมูลนักเรียนทั้งหมดในระบบ"
        columns={[
          { key: 'name_th', label: 'ชื่อ (ไทย)' },
          { key: 'name_en', label: 'ชื่อ (อังกฤษ)' },
          { key: 'created_at', label: 'วันที่เพิ่ม', render: (r) => new Date(r.created_at).toLocaleDateString('th-TH') },
          { key: 'status', label: 'สถานะ', render: (r) => <span className={`badge ${r.deleted_at ? 'badge-inactive' : 'badge-active'}`}>{r.deleted_at ? 'ลบแล้ว' : 'ใช้งาน'}</span> },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm({ name_en: '', name_th: '' }); setModal('add'); }}
        addLabel="เพิ่มนักเรียน" searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อนักเรียน..."
        actions={(row) => (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(row); setForm({ name_en: row.name_en ?? '', name_th: row.name_th ?? '' }); setModal('edit'); }}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'เพิ่มนักเรียนใหม่' : 'แก้ไขข้อมูลนักเรียน'} onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        <div className="form-group"><label className="form-label">ชื่อ (ภาษาไทย)</label><input className="form-input" value={form.name_th} onChange={e => setForm({ ...form, name_th: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">ชื่อ (ภาษาอังกฤษ)</label><input className="form-input" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
      </Modal>
      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={handleDelete} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>คุณต้องการลบ <strong>{selected?.name_th}</strong> ออกจากระบบหรือไม่?</p>
      </Modal>
    </>
  );
}
