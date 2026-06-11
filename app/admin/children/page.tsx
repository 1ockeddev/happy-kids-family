'use client';
import { useState, useEffect, useCallback } from 'react';
import { childrenApi } from '@/lib/api-client';
import { Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import AvatarCropper from '@/components/ui/AvatarCropper';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';

const EMPTY_FORM = { 
  name_en: '', 
  name_th: '', 
  firstname_en: '',
  lastname_en: '',
  firstname_th: '',
  lastname_th: '',
  nickname_th: '',
  nickname_en: '',
  birthdate: '',
  photo_url: null as string | null 
};

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
    
    // แปลง birthdate เป็นรูปแบบ YYYY-MM-DD สำหรับ input type="date"
    // ไม่ใช้ Date object เพื่อหลีกเลี่ยงปัญหา timezone offset
    let birthdateValue = '';
    if (row.birthdate) {
      // ถ้ามี T หรือ timestamp ให้ตัดออก
      const dateStr = row.birthdate.includes('T') 
        ? row.birthdate.split('T')[0] 
        : row.birthdate;
      // ใช้ string โดยตรง ไม่แปลงผ่าน Date object
      birthdateValue = dateStr;
    }
    
    setForm({ 
      name_en: row.name_en ?? '', 
      name_th: row.name_th ?? '', 
      firstname_en: row.firstname_en ?? '',
      lastname_en: row.lastname_en ?? '',
      firstname_th: row.firstname_th ?? '',
      lastname_th: row.lastname_th ?? '',
      nickname_th: row.nickname_th ?? '',
      nickname_en: row.nickname_en ?? '',
      birthdate: birthdateValue,
      photo_url: row.photo_url ?? null 
    });
    setPendingBlob(null);
    setModal('edit');
  };

  const handleSave = async () => {
    // ตรวจสอบว่ามีชื่ออย่างน้อย 1 ฟิลด์
    const hasAnyName = form.name_th || form.name_en || 
                       form.firstname_th || form.lastname_th || 
                       form.firstname_en || form.lastname_en ||
                       form.nickname_th || form.nickname_en;
    if (!hasAnyName) { 
      alert('กรุณากรอกชื่ออย่างน้อยหนึ่งช่อง'); 
      return; 
    }
    
    setSaving(true);
    try {
      const childData = {
        name_en: form.name_en || null,
        name_th: form.name_th || null,
        firstname_en: form.firstname_en || null,
        lastname_en: form.lastname_en || null,
        firstname_th: form.firstname_th || null,
        lastname_th: form.lastname_th || null,
        nickname_en: form.nickname_en || null,
        nickname_th: form.nickname_th || null,
        birthdate: form.birthdate || null,
        photo_url: form.photo_url,
      };
      
      if (modal === 'add') {
        // 1. สร้าง child ก่อน → ได้ id
        const newChild = await childrenApi.create({
          ...childData,
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
        await childrenApi.update(selected!.id, childData);
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
          { key: 'nickname_en', label: 'nickname', render: r => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.nickname_en ?? '-'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.nickname_th ?? '-'}</div>
            </div>
          )},
          { key: 'birthdate', label: 'Birthday', hideOnMobile: true,
            render: r => r.birthdate? new Date(r.birthdate).toLocaleDateString():'-' },
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
          defaultInitials={initials(form.nickname_th || form.firstname_th || form.name_th || form.nickname_en || form.firstname_en || form.name_en || '?')}
        />
        
        {/* ชื่อภาษาไทย */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>
            ชื่อเต็ม (ภาษาไทย)
          </label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>ชื่อ</label>
              <input className="form-input" value={form.firstname_th}
                onChange={e => setForm(f => ({ ...f, firstname_th: e.target.value }))}
                placeholder="เช่น เอมมา" />
            </div>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>นามสกุล</label>
              <input className="form-input" value={form.lastname_th}
                onChange={e => setForm(f => ({ ...f, lastname_th: e.target.value }))}
                placeholder="เช่น จอห์นสัน" />
            </div>
          </div>
        </div>
        
        {/* ชื่ออังกฤษ */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>
            ชื่อเต็ม (ภาษาอังกฤษ)
          </label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>First Name</label>
              <input className="form-input" value={form.firstname_en}
                onChange={e => setForm(f => ({ ...f, firstname_en: e.target.value }))}
                placeholder="e.g. Emma" />
            </div>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>Last Name</label>
              <input className="form-input" value={form.lastname_en}
                onChange={e => setForm(f => ({ ...f, lastname_en: e.target.value }))}
                placeholder="e.g. Johnson" />
            </div>
          </div>
        </div>
        
        {/* ชื่อเล่น */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>
            ชื่อเล่น
          </label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>ชื่อเล่น (ไทย)</label>
              <input className="form-input" value={form.nickname_th}
                onChange={e => setForm(f => ({ ...f, nickname_th: e.target.value }))}
                placeholder="เช่น เอ็ม" />
            </div>
            <div>
              <label className="form-label" style={{fontSize:12,color:'#6B7280'}}>Nickname (English)</label>
              <input className="form-input" value={form.nickname_en}
                onChange={e => setForm(f => ({ ...f, nickname_en: e.target.value }))}
                placeholder="e.g. Em" />
            </div>
          </div>
        </div>
        
        {/* วันเกิด */}
        <div className="form-group">
          <label className="form-label">วันเกิด</label>
          <input 
            type="date" 
            className="form-input" 
            value={form.birthdate}
            onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))}
            style={{fontFamily:'system-ui'}}
          />
        </div>
        
        <div style={{padding:12,background:'#FEF9C3',borderRadius:8,border:'1px solid #FDE68A',marginTop:8,display:'flex',gap:8}}>
          <AlertCircle size={16} color="#92400E" style={{flexShrink:0,marginTop:1}} />
          <p style={{fontSize:12,color:'#92400E',margin:0}}>
            <strong>หมายเหตุ:</strong> กรอกชื่ออย่างน้อยหนึ่งช่องเพื่อเพิ่มนักเรียน
          </p>
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
