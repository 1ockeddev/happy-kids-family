'use client';
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/api-client';
import { AppUser, UserRole, UserStatus, Child } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2, Link2, X } from 'lucide-react';
import { Plus as PlusIcon, PencilSquare, User, AlertCircle, CheckCircle, Building } from '@/components/icons';

interface UserWithChildren extends AppUser {
  children?: Child[];
  last_activity?: string | null;
}

interface Cohort {
  id: string;
  name: string;
  level: string;
}

const EMPTY_FORM = { 
  line_user_id: '', 
  display_name: '', 
  role: 'parent' as UserRole, 
  status: 'active' as UserStatus,
  can_select_cohort: true,
  default_cohort_id: null as string | null
};

export default function UsersPage() {
  const [data, setData]         = useState<UserWithChildren[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [cohorts, setCohorts]   = useState<Cohort[]>([]);
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
  // tabs state
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'parent' | 'admin'>('all');

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
      // กรอง super_admin ออก - ไม่แสดงใน UI
      const filteredUsers = withKids.filter(u => (u.role as string) !== 'super_admin');
      setData(filteredUsers);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  // โหลดนักเรียนทั้งหมดสำหรับ dropdown ผูก
  useEffect(() => {
    fetch('/api/children').then(r => r.json()).then(j => setAllChildren(j.data ?? []));
    fetch('/api/cohorts').then(r => r.json()).then(j => setCohorts(j.data ?? []));
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
    // Validation: display_name required สำหรับโหมด Add เท่านั้น
    if (modal === 'add' && !form.display_name.trim()) {
      alert('กรุณาระบุชื่อที่แสดง');
      return;
    }
    
    // Validation: ถ้า edit mode และลบชื่อออก ต้องมี line_display_name สำรอง
    if (modal === 'edit' && !form.display_name.trim() && !selected?.line_display_name) {
      alert('ไม่สามารถลบชื่อได้\n\nเหตุผล: ผู้ใช้นี้ยังไม่มีชื่อจาก LINE (ยังไม่ได้เปิด Mini App)\nกรุณาระบุชื่อที่แสดง หรือรอให้ผู้ใช้เปิด Mini App ก่อน');
      return;
    }
    
    // Validation: teacher ที่ไม่สามารถเลือก cohort ต้องมี default_cohort_id
    if (form.role === 'teacher' && !form.can_select_cohort && !form.default_cohort_id) {
      alert('⚠️ ต้องเลือกห้องเรียน Default\n\nเมื่อปิดการเลือกห้อง ต้องระบุห้องเรียน Default สำหรับครู');
      return;
    }
    
    setSaving(true);
    try {
      // ถ้าไม่ใส่ display_name ให้ใช้ line_display_name เป็น default (สำหรับ edit mode)
      const finalDisplayName = form.display_name.trim() 
        ? form.display_name.trim() 
        : (selected?.line_display_name || null);
      
      const payload: any = {
        display_name: finalDisplayName,
        role: form.role, status: form.status,
        line_user_id: form.line_user_id || null,
      };
      
      // เพิ่ม cohort settings สำหรับ teacher
      if (form.role === 'teacher') {
        payload.can_select_cohort = form.can_select_cohort;
        payload.default_cohort_id = form.default_cohort_id || null;
      }
      
      const roleChanged = modal === 'edit' && selected && selected.role !== form.role;
      
      modal === 'add'
        ? await usersApi.create(payload)
        : await usersApi.update(selected!.id, payload);
      
      setModal(null); 
      load();
      
      // แจ้งเตือนถ้าเปลี่ยน role
      if (roleChanged) {
        alert(`บันทึกสำเร็จ!\n\nสำคัญ: ผู้ใช้ "${finalDisplayName || 'ผู้ใช้นี้'}" ต้องรีเฟรชหน้า Mini App\nเพื่อให้เห็นบทบาทใหม่ (${form.role === 'teacher' ? 'ครู' : form.role === 'admin' ? 'Admin' : 'ผู้ปกครอง'})`);
      }
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

  // กรองข้อมูลตาม tab
  const filteredData = data.filter(u => {
    if (activeTab === 'all') return true;
    return u.role === activeTab;
  });

  // นับจำนวนแต่ละ role
  const counts = {
    all: data.length,
    teacher: data.filter(u => u.role === 'teacher').length,
    parent: data.filter(u => u.role === 'parent').length,
    admin: data.filter(u => u.role === 'admin').length,
  };

  // Format last activity
  const formatLastActivity = (timestamp: string | null | undefined) => {
    if (!timestamp) return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>ไม่เคยใช้งาน</span>;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return <span style={{ color: '#10B981', fontSize: 12 }}>เมื่อสักครู่</span>;
    if (diffMins < 60) return <span style={{ color: '#10B981', fontSize: 12 }}>{diffMins} นาทีที่แล้ว</span>;
    if (diffHours < 24) return <span style={{ color: '#F59E0B', fontSize: 12 }}>{diffHours} ชั่วโมงที่แล้ว</span>;
    if (diffDays < 7) return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{diffDays} วันที่แล้ว</span>;
    return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
  };

  return (
    <>
      {/* Tabs */}
      <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { key: 'all', label: 'ทั้งหมด', icon: '📋', count: counts.all },
            { key: 'teacher', label: 'ครู', icon: '👨‍🏫', count: counts.teacher },
            { key: 'parent', label: 'ผู้ปกครอง', icon: '👨‍👩‍👧', count: counts.parent },
            { key: 'admin', label: 'Admin', icon: '⚙️', count: counts.admin },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.key ? '3px solid #6366f1' : '3px solid transparent',
                color: activeTab === tab.key ? '#6366f1' : '#64748b',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{ 
                background: activeTab === tab.key ? '#e0e7ff' : '#f1f5f9',
                color: activeTab === tab.key ? '#4338ca' : '#64748b',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <CrudTable<UserWithChildren>
        title="จัดการผู้ใช้"
        description="เพิ่มผู้ใช้ใหม่ได้ทันที — ผูก LINE ID ภายหลังเมื่อผู้ใช้เปิด Mini App"
        columns={[
          { key: 'display_name', label: 'ผู้ใช้', render: r => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar: LINE picture หรือ emoji */}
              {r.picture_url ? (
                <img src={r.picture_url} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: r.role === 'teacher' ? '#F0EEFF' : '#FEF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} color={r.role === 'teacher' ? '#6C5CE7' : '#E8754A'} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {r.display_name ?? '(ยังไม่มีชื่อ)'}
                  {r.line_display_name && r.line_display_name !== r.display_name && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6 }}>
                      (LINE: {r.line_display_name})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {r.line_user_id
                    ? <><CheckCircle size={11} color="#10B981" /> <span style={{ color: '#10B981' }}>{r.line_user_id}</span></>
                    : <><AlertCircle size={11} color="#F59E0B" /> <span style={{ color: '#F59E0B', fontSize: 11 }}>รอผูก LINE</span></>
                  }
                </div>
                {/* Last Activity ใต้ LINE ID */}
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {formatLastActivity(r.last_activity)}
                </div>
              </div>
            </div>
          )},
          { key: 'role', label: 'บทบาท', render: r => {
            const roleConfig: Record<string, { label: string; class: string; icon: string }> = {
              admin: { label: 'Admin', class: 'badge-admin', icon: '⚙️' },
              teacher: { label: 'ครู', class: 'badge-teacher', icon: '👨‍🏫' },
              parent: { label: 'ผู้ปกครอง', class: 'badge-parent', icon: '👨‍👩‍👧' }
            };
            const config = roleConfig[r.role] || { label: r.role, class: 'badge', icon: '' };
            return (
              <span className={`badge ${config.class}`}>
                {config.icon} {config.label}
              </span>
            );
          }},
          { key: 'children', label: 'ลูกที่ผูก', render: r => {
            if (r.role !== 'parent') return <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>-</span>;
            const kids = r.children ?? [];
            if (kids.length === 0) return (
              <span style={{ fontSize: 12, color: '#F5A623', background: '#FEF6E6', padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={11} color="#F5A623" /> ยังไม่ผูก
              </span>
            );
            return (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {kids.map(c => (
                  <span key={c.id} style={{ fontSize: 12, background: 'var(--bg-secondary)', color: '#4CAF76', padding: '2px 8px', borderRadius: 99 }}>{c.name_th}</span>
                ))}
              </div>
            );
          }},
          { key: 'status', label: 'สถานะ', hideOnMobile: true, render: r => (
            <span className={`badge badge-${r.status}`}>{r.status === 'active' ? 'ใช้งาน' : 'ปิด'}</span>
          )},
          { key: 'created_at', label: 'สร้างเมื่อ', hideOnMobile: true, render: r => new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) },
        ]}
        data={filteredData} loading={loading} error={error} onRefresh={load}
        onAdd={() => { setForm(EMPTY_FORM); setModal('add'); }}
        addLabel="+ เพิ่มผู้ใช้"
        searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อ / LINE ID..."
        actions={row => (
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
            {row.role === 'parent' && (
              <button className="btn btn-ghost btn-sm" style={{ color: '#4CAF76', borderColor: '#4CAF76' }} onClick={() => openLink(row)}>
                <Link2 size={13} /> ผูกลูก
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => { 
              setSelected(row); 
              setForm({ 
                line_user_id: row.line_user_id ?? '', 
                display_name: row.display_name ?? '', 
                role: row.role, 
                status: row.status,
                can_select_cohort: row.can_select_cohort ?? true,
                default_cohort_id: row.default_cohort_id ?? null
              }); 
              setModal('edit'); 
            }}>
              <Pencil size={13} />
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal 
        open={modal === 'add' || modal === 'edit'} 
        title={
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {modal === 'add' ? <PlusIcon size={20} color="#6366f1" /> : <PencilSquare size={20} color="#6366f1" />}
            <span>{modal === 'add' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}</span>
          </div>
        }
        onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>
        
        {/* คำอธิบายสำหรับโหมด Add */}
        {modal === 'add' && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <AlertCircle size={18} color="#3b82f6" />
            </div>
            <p style={{ fontSize: 13, color: '#1E40AF', margin: 0, lineHeight: 1.6 }}>
              <strong>วิธีใช้:</strong> เพิ่มผู้ใช้ได้ทันทีโดยไม่ต้องมี LINE ID<br/>
              เมื่อผู้ใช้เปิด Mini App ครั้งแรก ระบบจะผูก LINE ID อัตโนมัติ
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            ชื่อที่แสดง
            {modal === 'add' && <span style={{ color: '#E85C5C' }}> *</span>}
            {modal === 'edit' && selected?.line_display_name && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6 }}>
                (ชื่อ LINE: {selected.line_display_name})
              </span>
            )}
          </label>
          <input 
            className="form-input" 
            value={form.display_name} 
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} 
            placeholder={
              modal === 'edit' && selected?.line_display_name 
                ? `ไม่ระบุจะใช้: ${selected.line_display_name}`
                : "เช่น ครูเบียร์ / คุณแม่สมศรี / คุณพ่อสมชาย"
            }
            autoFocus
          />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            {modal === 'edit' && selected?.line_display_name ? 
              '💡 ปล่อยว่างเพื่อใช้ชื่อ LINE อัตโนมัติ หรือใส่ชื่อที่ต้องการแทน' :
              modal === 'add' ?
              'ชื่อนี้จะแสดงในระบบและรายงาน (บังคับระบุ)' :
              'ชื่อนี้จะแสดงในระบบและรายงาน'
            }
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            LINE User ID
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 400 }}>
              (ไม่บังคับ)
            </span>
          </label>
          <input 
            className="form-input" 
            value={form.line_user_id}
            onChange={e => setForm(f => ({ ...f, line_user_id: e.target.value }))}
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          
          {/* แสดงคำแนะนำตามสถานะ */}
          {modal === 'add' && !form.line_user_id && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', gap: 8 }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <AlertCircle size={14} color="#92400E" />
              </div>
              <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                <strong>ผูกภายหลัง:</strong> ปล่อยว่างไว้ได้<br/>
                ระบบจะผูก LINE ID อัตโนมัติเมื่อผู้ใช้เปิด Mini App
              </p>
            </div>
          )}
          
          {modal === 'edit' && !form.line_user_id && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', gap: 8 }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <AlertCircle size={14} color="#991B1B" />
              </div>
              <p style={{ fontSize: 11, color: '#991B1B', margin: 0, lineHeight: 1.5 }}>
                <strong>ยังไม่ผูก LINE:</strong><br/>
                • ผู้ใช้ยังไม่สามารถเข้า Mini App ได้<br/>
                • จะผูกอัตโนมัติเมื่อเปิด Mini App ครั้งแรก<br/>
                • หรือคุณสามารถใส่ LINE ID ด้วยตนเองได้
              </p>
            </div>
          )}
          
          {form.line_user_id && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} color="#065F46" />
              <p style={{ fontSize: 11, color: '#065F46', margin: 0 }}>
                ผูก LINE แล้ว — ผู้ใช้สามารถเข้า Mini App ได้
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">บทบาท <span style={{ color: '#E85C5C' }}>*</span></label>
            <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="parent">👨‍👩‍👧 ผู้ปกครอง</option>
              <option value="teacher">👨‍🏫 ครู</option>
              <option value="admin">⚙️ Admin</option>
            </select>
            {modal === 'edit' && selected && selected.role !== form.role && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 6, display: 'flex', gap: 6 }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <AlertCircle size={12} color="#92400E" />
                </div>
                <p style={{ fontSize: 10, color: '#92400E', margin: 0, lineHeight: 1.4 }}>
                  <strong>สำคัญ:</strong> หลังเปลี่ยนบทบาท<br/>ผู้ใช้ต้อง <strong>รีเฟรชหน้า Mini App</strong> ถึงจะเห็นการเปลี่ยนแปลง
                </p>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">สถานะ</label>
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as UserStatus }))}>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        {/* คำแนะนำเพิ่มเติมสำหรับผู้ปกครอง */}
        {form.role === 'parent' && modal === 'add' && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--accent-bg)', border: '1px solid #DDD6FE', borderRadius: 8, display: 'flex', gap: 10 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <PencilSquare size={16} color="#5B21B6" />
            </div>
            <p style={{ fontSize: 12, color: '#5B21B6', margin: 0, lineHeight: 1.5 }}>
              <strong>ขั้นตอนถัดไป:</strong><br/>
              1. บันทึกผู้ใช้นี้<br/>
              2. คลิก "ผูกลูก" เพื่อเชื่อมโยงกับนักเรียน<br/>
              3. แจ้งผู้ปกครองให้เปิด Mini App เพื่อผูก LINE ID
            </p>
          </div>
        )}

        {/* ตั้งค่า Cohort สำหรับครู */}
        {form.role === 'teacher' && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--accent-bg)', border: '1px solid #DDD6FE', borderRadius: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#5B21B6', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={16} color="#5B21B6" />
              ตั้งค่าห้องเรียน (Teacher Mode)
            </h4>
            
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.can_select_cohort}
                  onChange={e => setForm(f => ({ ...f, can_select_cohort: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  อนุญาตให้เลือกห้องเรียนใน User Side
                </span>
              </label>
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginLeft: 26, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                {form.can_select_cohort 
                  ? <><CheckCircle size={12} color="#10B981" /> <span>ครูสามารถเลือกห้องเรียนได้เองผ่าน dropdown</span></>
                  : <><AlertCircle size={12} color="#F59E0B" /> <span>ครูจะถูกบังคับให้ใช้ห้องเรียนที่กำหนดด้านล่าง</span></>
                }
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                ห้องเรียน Default
                {!form.can_select_cohort && <span style={{ color: '#E85C5C' }}> *</span>}
              </label>
              <select 
                className="form-input" 
                value={form.default_cohort_id || ''}
                onChange={e => setForm(f => ({ ...f, default_cohort_id: e.target.value || null }))}
              >
                <option value="">-- เลือกห้องเรียน --</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.level ? `(${c.level})` : ''}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                {form.can_select_cohort
                  ? 'ห้องที่จะถูกเลือกอัตโนมัติเมื่อเปิดครั้งแรก'
                  : 'ห้องเรียนเดียวที่ครูสามารถเข้าถึงได้'
                }
              </p>
            </div>

            {!form.can_select_cohort && !form.default_cohort_id && (
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={12} color="#991B1B" />
                <p style={{ fontSize: 11, color: '#991B1B', margin: 0 }}>
                  กรุณาเลือกห้องเรียน Default เมื่อปิดการเลือกห้อง
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Link Children Modal ── */}
      <Modal open={modal === 'link'}
        title={`ผูกนักเรียน — ${selected?.display_name ?? selected?.line_user_id ?? '(ไม่มีชื่อ)'?.slice(0,12) ?? '(ไม่มี LINE ID)'}`}
        onClose={() => setModal(null)} onConfirm={handleSaveLink}
        confirmLabel={saving ? 'กำลังบันทึก...' : `บันทึก (${linkedIds.length} คน)`}>

        {/* ผู้ปกครอง info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
          {selected?.picture_url
            ? <img src={selected.picture_url} style={{ width: 40, height: 40, borderRadius: '50%' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#E8754A" />
              </div>
          }
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{selected?.display_name ?? '(ยังไม่มีชื่อ)'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{selected?.line_user_id ?? '(ยังไม่ผูก LINE)'}</p>
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
            <p style={{ fontSize: 12, fontWeight: 600, color: '#4CAF76', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} color="#4CAF76" /> ผูกแล้ว {linkedIds.length} คน
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {linkedIds.map(id => {
                const c = allChildren.find(c => c.id === id);
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', border: '1px solid #D1FAE5', padding: '4px 10px', borderRadius: 99 }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid #F3F4F6', background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
              <div style={{ flexShrink: 0 }}>
                <PlusIcon size={14} color="#9CA3AF" />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name_th}</div>
                {c.name_en && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.name_en}</div>}
              </div>
            </button>
          ))}
          {filteredChildren.filter(c => !linkedIds.includes(c.id)).length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: '16px 0' }}>ไม่พบนักเรียน</p>
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
