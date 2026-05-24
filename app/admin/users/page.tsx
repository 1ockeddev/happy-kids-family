'use client';
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/api-client';
import { AppUser, UserRole, UserStatus, Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2, Link2, Plus, X } from 'lucide-react';

interface UserWithChildren extends AppUser {
  children?: Child[];
}

const EMPTY_FORM = { line_user_id: '', display_name: '', role: 'parent' as UserRole, status: 'active' as UserStatus };

export default function UsersPage() {
  const [data, setData]         = useState<UserWithChildren[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'add' | 'edit' | 'delete' | 'link' | null>(null);
  const [selected, setSelected] = useState<UserWithChildren | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  // link children modal state
  const [linkedIds, setLinkedIds]   = useState<string[]>([]);
  const [childSearch, setChildSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // load users พร้อม children ที่ผูกไว้
      const rows = await usersApi.list(search ? { search } : {}) as UserWithChildren[];
      // ดึง parent_child สำหรับแต่ละ parent
      const withKids = await Promise.all(rows.map(async u => {
        if (u.role !== 'parent') return u;
        const res  = await fetch(`/api/report/line-children?line_user_id=${u.line_user_id}`);
        const json = await res.json();
        return { ...u, children: json.data ?? [] };
      }));
      setData(withKids);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  // โหลดนักเรียนทั้งหมดสำหรับ dropdown ผูก
  useEffect(() => {
    fetch('/api/children').then(r => r.json()).then(j => setAllChildren(j.data ?? []));
  }, []);

  // ── open link modal ─────────────────────────────────────
  const openLink = (u: UserWithChildren) => {
    setSelected(u);
    setLinkedIds((u.children ?? []).map(c => c.id));
    setChildSearch('');
    setModal('link');
  };

  // ── save linked children ────────────────────────────────
  const handleSaveLink = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/users/${selected.id}/children`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_ids: linkedIds }),
      });
      setModal(null);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        display_name: form.display_name || null,
        role: form.role, status: form.status,
        line_user_id: form.line_user_id || null,
      };
      modal === 'add'
        ? await usersApi.create(payload)
        : await usersApi.update(selected!.id, payload);
      setModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await usersApi.delete(selected!.id); setModal(null); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const toggleChild = (id: string) =>
    setLinkedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredChildren = allChildren.filter(c =>
    c.name_th?.includes(childSearch) || c.name_en?.toLowerCase().includes(childSearch.toLowerCase())
  );

  return (
    <>
      <CrudTable<UserWithChildren>
        title="จัดการผู้ใช้"
        description="ผู้ปกครองที่ login ผ่าน LINE จะปรากฏอัตโนมัติ"
        columns={[
          { key: 'display_name', label: 'ผู้ใช้', render: r => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar: LINE picture หรือ emoji */}
              {r.picture_url ? (
                <img src={r.picture_url} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: r.role === 'teacher' ? '#F0EEFF' : '#FEF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {r.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.display_name ?? '(ยังไม่มีชื่อ)'}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>
                {r.line_user_id
                  ? <span>{r.line_user_id.slice(0, 16)}...</span>
                  : <span style={{ color: '#F5A623', fontSize: 11 }}>⚠️ ยังไม่ผูก LINE</span>
                }
              </div>
              </div>
            </div>
          )},
          { key: 'role', label: 'บทบาท', render: r => (
            <span className={`badge badge-${r.role}`}>{r.role === 'teacher' ? 'ครู' : 'ผู้ปกครอง'}</span>
          )},
          { key: 'children', label: 'ลูกที่ผูก', render: r => {
            if (r.role !== 'parent') return <span style={{ color: '#9CA3AF', fontSize: 12 }}>-</span>;
            const kids = r.children ?? [];
            if (kids.length === 0) return (
              <span style={{ fontSize: 12, color: '#F5A623', background: '#FEF6E6', padding: '2px 8px', borderRadius: 99 }}>⚠️ ยังไม่ผูก</span>
            );
            return (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {kids.map(c => (
                  <span key={c.id} style={{ fontSize: 12, background: '#EBF7F0', color: '#4CAF76', padding: '2px 8px', borderRadius: 99 }}>{c.name_th}</span>
                ))}
              </div>
            );
          }},
          { key: 'status', label: 'สถานะ', hideOnMobile: true, render: r => (
            <span className={`badge badge-${r.status}`}>{r.status === 'active' ? 'ใช้งาน' : 'ปิด'}</span>
          )},
          { key: 'created_at', label: 'สมัคร', hideOnMobile: true, render: r => new Date(r.created_at).toLocaleDateString('th-TH') },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm(EMPTY_FORM); setModal('add'); }}
        addLabel="เพิ่มผู้ใช้"
        searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อ / LINE ID..."
        actions={row => (
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
            {row.role === 'parent' && (
              <button className="btn btn-ghost btn-sm" style={{ color: '#4CAF76', borderColor: '#4CAF76' }} onClick={() => openLink(row)}>
                <Link2 size={13} /> ผูกลูก
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(row); setForm({ line_user_id: row.line_user_id ?? '', display_name: row.display_name ?? '', role: row.role, status: row.status }); setModal('edit'); }}>
              <Pencil size={13} />
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'}
        onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        <div className="form-group">
          <label className="form-label">ชื่อที่แสดง <span style={{ color: '#E85C5C' }}>*</span></label>
          <input className="form-input" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="เช่น ครูเบียร์ / คุณแม่สมศรี" />
        </div>
        <div className="form-group">
          <label className="form-label">
            LINE User ID
            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6, fontWeight: 400 }}>
              (ไม่จำเป็น — ผูกภายหลังได้)
            </span>
          </label>
          <input className="form-input" value={form.line_user_id}
            onChange={e => setForm(f => ({ ...f, line_user_id: e.target.value }))}
            placeholder="Uxxxxxxx... (กรอกเมื่อผู้ใช้เคย login ผ่าน LINE แล้ว)" />
          {!form.line_user_id && (
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              💡 ผู้ใช้จะได้รับ LINE ID อัตโนมัติเมื่อเปิด Mini App ครั้งแรก
            </p>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">บทบาท</label>
            <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="parent">ผู้ปกครอง</option>
              <option value="teacher">ครู</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">สถานะ</label>
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as UserStatus }))}>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* ── Link Children Modal ── */}
      <Modal open={modal === 'link'}
        title={`ผูกนักเรียน — ${selected?.display_name ?? selected?.line_user_id ?? '(ไม่มีชื่อ)'?.slice(0,12) ?? '(ไม่มี LINE ID)'}`}
        onClose={() => setModal(null)} onConfirm={handleSaveLink}
        confirmLabel={saving ? 'กำลังบันทึก...' : `บันทึก (${linkedIds.length} คน)`}>

        {/* ผู้ปกครอง info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F7F5F2', borderRadius: 10 }}>
          {selected?.picture_url
            ? <img src={selected.picture_url} style={{ width: 40, height: 40, borderRadius: '50%' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍👩‍👧</div>
          }
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{selected?.display_name ?? '(ยังไม่มีชื่อ)'}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontFamily: 'monospace' }}>{selected?.line_user_id ?? '(ยังไม่ผูก LINE)'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="form-group">
          <label className="form-label">ค้นหานักเรียน</label>
          <input className="form-input" value={childSearch} onChange={e => setChildSearch(e.target.value)} placeholder="ชื่อนักเรียน..." />
        </div>

        {/* ที่ผูกแล้ว */}
        {linkedIds.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#4CAF76', marginBottom: 6 }}>✅ ผูกแล้ว {linkedIds.length} คน</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {linkedIds.map(id => {
                const c = allChildren.find(c => c.id === id);
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EBF7F0', border: '1px solid #D1FAE5', padding: '4px 10px', borderRadius: 99 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{c?.name_th ?? id.slice(0, 8)}</span>
                    <button type="button" onClick={() => toggleChild(id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* รายชื่อทั้งหมด */}
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredChildren.filter(c => !linkedIds.includes(c.id)).map(c => (
            <button key={c.id} type="button" onClick={() => toggleChild(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid #F3F4F6', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
              <Plus size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name_th}</div>
                {c.name_en && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.name_en}</div>}
              </div>
            </button>
          ))}
          {filteredChildren.filter(c => !linkedIds.includes(c.id)).length === 0 && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>ไม่พบนักเรียน</p>
          )}
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={modal === 'delete'} title="ยืนยันการลบ"
        onClose={() => setModal(null)} onConfirm={handleDelete}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ลบผู้ใช้ <strong>{selected?.display_name ?? selected?.line_user_id ?? '(ไม่มีชื่อ)'}</strong>?</p>
      </Modal>
    </>
  );
}
