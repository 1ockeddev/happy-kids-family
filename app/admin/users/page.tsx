'use client';
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/api-client';
import { AppUser, UserRole, UserStatus } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ line_user_id: '', display_name: '', role: 'teacher' as UserRole, status: 'active' as UserStatus });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await usersApi.list(search ? { search } : {}) as AppUser[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      modal === 'add' ? await usersApi.create(form) : await usersApi.update(selected!.id, form);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <CrudTable<AppUser>
        title="จัดการผู้ใช้" description="จัดการครู ผู้ปกครอง และสิทธิ์การเข้าถึง"
        columns={[
          { key: 'display_name', label: 'ชื่อ', render: (r) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.role === 'teacher' ? '#F0EEFF' : '#FEF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{r.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}</div>
              <div><div style={{ fontWeight: 500 }}>{r.display_name ?? '-'}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.line_user_id}</div></div>
            </div>
          )},
          { key: 'role', label: 'บทบาท', render: (r) => <span className={`badge badge-${r.role}`}>{r.role === 'teacher' ? 'ครู' : 'ผู้ปกครอง'}</span> },
          { key: 'status', label: 'สถานะ', render: (r) => <span className={`badge badge-${r.status}`}>{r.status === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน'}</span> },
          { key: 'created_at', label: 'สมัครเมื่อ', render: (r) => new Date(r.created_at).toLocaleDateString('th-TH') },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm({ line_user_id: '', display_name: '', role: 'teacher', status: 'active' }); setModal('add'); }}
        addLabel="เพิ่มผู้ใช้" searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อ / LINE ID..."
        actions={(row) => (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(row); setForm({ line_user_id: row.line_user_id, display_name: row.display_name ?? '', role: row.role, status: row.status }); setModal('edit'); }}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'} onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        <div className="form-group"><label className="form-label">ชื่อที่แสดง</label><input className="form-input" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">LINE User ID</label><input className="form-input" value={form.line_user_id} onChange={e => setForm({ ...form, line_user_id: e.target.value })} placeholder="Uxxxxxxxxx" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group"><label className="form-label">บทบาท</label>
            <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="teacher">ครู</option><option value="parent">ผู้ปกครอง</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">สถานะ</label>
            <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as UserStatus })}>
              <option value="active">ใช้งาน</option><option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>
      </Modal>
      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={async () => { setSaving(true); try { await usersApi.delete(selected!.id); setModal(null); load(); } finally { setSaving(false); } }} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ปิดใช้งานผู้ใช้ <strong>{selected?.display_name}</strong>?</p>
      </Modal>
    </>
  );
}
