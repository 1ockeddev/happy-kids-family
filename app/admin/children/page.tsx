'use client';
import { useState, useEffect, useCallback } from 'react';
import { childrenApi } from '@/lib/api-client';
import { Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import AvatarCropper from '@/components/ui/AvatarCropper';
import { Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { name_en: '', name_th: '', photo_url: null as string | null };

function ChildAvatar({ child }: { child: Child }) {
  const initials = (child.name_th ?? child.name_en ?? '?').slice(0, 1).toUpperCase();
  const colors   = ['#E8754A','#6C5CE7','#4A90B8','#4CAF76','#F5A623','#E85C5C'];
  const bg       = colors[initials.charCodeAt(0) % colors.length];
  return child.photo_url ? (
    <img src={child.photo_url} alt={child.name_th ?? ''}
      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB', flexShrink: 0 }} />
  ) : (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ChildrenPage() {
  const [data, setData]         = useState<Child[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Child | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  // add mode: เก็บ blob ชั่วคราว รอ upload หลัง child ถูกสร้างแล้วได้ id
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await childrenApi.list(search) as Child[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setPendingBlob(null);
    setModal('add');
  };
  const openEdit = (row: Child) => {
    setSelected(row);
    setForm({ name_en: row.name_en ?? '', name_th: row.name_th ?? '', photo_url: row.photo_url ?? null });
    setPendingBlob(null);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name_th && !form.name_en) { alert('กรุณากรอกชื่อนักเรียน'); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        // 1. สร้าง child ก่อน → ได้ id
        const newChild = await childrenApi.create({
          name_en: form.name_en || null,
          name_th: form.name_th || null,
          photo_url: null,  // ยังไม่มี URL
        }) as Child;

        // 2. ถ้ามีรูปค้างอยู่ → upload พร้อม id จริง
        if (pendingBlob && newChild.id) {
          const fd = new FormData();
          fd.append('file', pendingBlob, 'avatar.webp');
          fd.append('child_id', newChild.id);
          const res  = await fetch('/api/upload', { method: 'POST', body: fd });
          const json = await res.json();
          if (res.ok && json.data?.url) {
            // 3. update child ใส่ photo_url
            await childrenApi.update(newChild.id, { photo_url: json.data.url });
          }
        }
      } else {
        // edit mode: AvatarCropper upload ตรงแล้ว form.photo_url เป็น URL จริง
        await childrenApi.update(selected!.id, {
          name_en:   form.name_en || null,
          name_th:   form.name_th || null,
          photo_url: form.photo_url,
        });
      }
      setModal(null);
      setPendingBlob(null);
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
      // ลบรูปจาก Supabase Storage ด้วย
      if (selected?.photo_url?.includes('supabase')) {
        await fetch(`/api/upload?child_id=${selected.id}`, { method: 'DELETE' }).catch(() => {});
      }
      await childrenApi.delete(selected!.id);
      setModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const initials = (s: string) => (s || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <CrudTable<Child>
        title="นักเรียน"
        description="จัดการข้อมูลนักเรียนทั้งหมดในระบบ"
        columns={[
          { key: 'photo', label: '', render: r => <ChildAvatar child={r} /> },
          { key: 'name_th', label: 'ชื่อ', render: r => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.name_th ?? '-'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.name_en}</div>
            </div>
          )},
          { key: 'created_at', label: 'วันที่เพิ่ม', hideOnMobile: true,
            render: r => new Date(r.created_at).toLocaleDateString('th-TH') },
          { key: 'status', label: 'สถานะ', hideOnMobile: true,
            render: r => <span className={`badge ${r.deleted_at ? 'badge-inactive' : 'badge-active'}`}>{r.deleted_at ? 'ลบแล้ว' : 'ใช้งาน'}</span> },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={openAdd} addLabel="เพิ่มนักเรียน"
        searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อนักเรียน..."
        actions={row => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}><Pencil size={13} /></button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /></button>
          </div>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'เพิ่มนักเรียนใหม่' : 'แก้ไขข้อมูลนักเรียน'}
        onClose={() => { setModal(null); setPendingBlob(null); }}
        onConfirm={handleSave}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        <AvatarCropper
          childId={modal === 'edit' ? selected?.id : undefined}
          value={form.photo_url}
          onChange={url => setForm(f => ({ ...f, photo_url: url }))}
          onPendingBlob={blob => setPendingBlob(blob)}
          defaultInitials={initials(form.name_th || form.name_en || '?')}
        />
        <div className="form-group">
          <label className="form-label">ชื่อ (ภาษาไทย) <span style={{ color: '#E85C5C' }}>*</span></label>
          <input className="form-input" value={form.name_th}
            onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
            placeholder="เช่น เอมมา จอห์นสัน" />
        </div>
        <div className="form-group">
          <label className="form-label">ชื่อ (ภาษาอังกฤษ)</label>
          <input className="form-input" value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            placeholder="e.g. Emma Johnson" />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={modal === 'delete'} title="ยืนยันการลบ"
        onClose={() => setModal(null)} onConfirm={handleDelete}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selected && <ChildAvatar child={selected} />}
          <p style={{ color: '#6B7280' }}>
            ลบ <strong>{selected?.name_th}</strong> ออกจากระบบ? รูปโปรไฟล์จะถูกลบออกจาก Storage ด้วย
          </p>
        </div>
      </Modal>
    </>
  );
}
