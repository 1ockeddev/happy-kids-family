'use client';
import { useState, useEffect, useCallback } from 'react';
import { enrollmentsApi, childrenApi, cohortsApi } from '@/lib/api-client';
import { Enrollment, Child, Cohort } from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { child_id: '', cohort_id: '', start_date: '', end_date: '', graduated: false };

export default function EnrollmentsPage() {
  const [data, setData]         = useState<Enrollment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [cohorts, setCohorts]   = useState<Cohort[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [modal, setModal]       = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  // ── fetch ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const rows = await enrollmentsApi.list(params) as Enrollment[];
      setData(rows);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // load dropdowns once
  useEffect(() => {
    childrenApi.list().then(rows => setChildren(rows as Child[])).catch(() => {});
    cohortsApi.list().then(rows => setCohorts(rows as Cohort[])).catch(() => {});
  }, []);

  // ── derive enrolled child IDs per cohort for quick filtering ─
  const enrolledChildIds = new Set(data.map(e => `${e.child_id}:${e.cohort_id}`));
  const unenrolledChildren = (cohortId: string) =>
    children.filter(c => !enrolledChildIds.has(`${c.id}:${cohortId}`));

  // ── open modals ─────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setModal('add'); };
  const openEdit = (e: Enrollment) => {
    setSelected(e);
    setForm({ child_id: e.child_id, cohort_id: e.cohort_id, start_date: e.start_date, end_date: e.end_date ?? '', graduated: e.graduated });
    setModal('edit');
  };

  // ── save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.child_id || !form.cohort_id || !form.start_date) {
      alert('กรุณาเลือกนักเรียน ห้องเรียน และวันเริ่มต้น'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, end_date: form.end_date || null };
      modal === 'add'
        ? await enrollmentsApi.create(payload)
        : await enrollmentsApi.update(selected!.id, { end_date: payload.end_date, graduated: payload.graduated });
      setModal(null); fetchData();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await enrollmentsApi.delete(selected!.id);
      setModal(null); fetchData();
    } catch (e) { alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  // available children for add modal (not in selected cohort yet)
  const availableChildren = form.cohort_id ? unenrolledChildren(form.cohort_id) : children;

  return (
    <>
      {error && (
        <div style={{ margin: '16px 32px', padding: '12px 16px', background: '#FDECEC', borderRadius: 8, color: '#E85C5C', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <CrudTable<Enrollment>
        title="ลงทะเบียนเรียน"
        description="จัดการการลงทะเบียนนักเรียนเข้าห้องเรียน"
        loading={loading}
        onRefresh={fetchData}
        columns={[
          { key: 'child', label: 'นักเรียน', render: r => (
            <div>
              <div style={{ fontWeight: 500 }}>{r.child?.name_th ?? '-'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.child?.name_en}</div>
            </div>
          )},
          { key: 'cohort', label: 'ห้องเรียน', render: r => (
            <div>
              <span className="badge badge-teacher">{r.cohort?.name}</span>
              <span style={{ marginLeft: 6, fontSize: 12, color: '#9CA3AF' }}>{r.cohort?.level}</span>
            </div>
          )},
          { key: 'start_date', label: 'วันเริ่ม', render: r => new Date(r.start_date).toLocaleDateString('th-TH') },
          { key: 'end_date', label: 'วันสิ้นสุด', render: r => r.end_date
            ? new Date(r.end_date).toLocaleDateString('th-TH')
            : <span style={{ color: '#9CA3AF' }}>ปัจจุบัน</span> },
          { key: 'graduated', label: 'สถานะ', render: r => (
            <span className={`badge ${r.graduated ? 'badge-active' : 'badge-leave'}`}>
              {r.graduated ? '🎓 สำเร็จแล้ว' : '📚 กำลังเรียน'}
            </span>
          )},
        ]}
        data={data}
        onAdd={openAdd}
        addLabel="เพิ่มการลงทะเบียน"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหานักเรียน / ห้องเรียน..."
        actions={row => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'เพิ่มการลงทะเบียน' : `แก้ไข — ${selected?.child?.name_th}`}
        onClose={() => setModal(null)}
        onConfirm={handleSave}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        {modal === 'add' && (<>
          {/* Step 1: Choose cohort first */}
          <div className="form-group">
            <label className="form-label">ห้องเรียน <span style={{ color: '#E85C5C' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cohorts.map(c => (
                <button key={c.id} type="button"
                  onClick={() => setForm(f => ({ ...f, cohort_id: c.id, child_id: '' }))}
                  style={{
                    padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun, sans-serif',
                    background: form.cohort_id === c.id ? '#1A1A2E' : '#F3F4F6',
                    color: form.cohort_id === c.id ? 'white' : '#6B7280',
                    fontWeight: form.cohort_id === c.id ? 600 : 400,
                    transition: 'all 0.15s',
                  }}>
                  {c.name} <span style={{ opacity: 0.7, fontSize: 12 }}>({c.level})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose child (filtered by cohort) */}
          <div className="form-group">
            <label className="form-label">
              นักเรียน <span style={{ color: '#E85C5C' }}>*</span>
              {form.cohort_id && (
                <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                  ({availableChildren.length} คนที่ยังไม่ได้ลงทะเบียน)
                </span>
              )}
            </label>
            {!form.cohort_id ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                เลือกห้องเรียนก่อน
              </p>
            ) : availableChildren.length === 0 ? (
              <p style={{ fontSize: 13, color: '#F5A623', padding: '10px 12px', background: '#FEF6E6', borderRadius: 8 }}>
                นักเรียนทุกคนลงทะเบียนในห้องนี้แล้ว
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 200, overflowY: 'auto', padding: 4 }}>
                {availableChildren.map(c => (
                  <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, child_id: c.id }))}
                    style={{
                      padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun, sans-serif',
                      background: form.child_id === c.id ? '#E8754A' : '#F3F4F6',
                      color: form.child_id === c.id ? 'white' : '#6B7280',
                      fontWeight: form.child_id === c.id ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                    {c.name_th}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>)}

        {/* Read-only info for edit */}
        {modal === 'edit' && selected && (
          <div style={{ padding: '10px 14px', background: '#F7F5F2', borderRadius: 8, fontSize: 14, color: '#6B7280', display: 'flex', gap: 12 }}>
            <span>👧 <strong style={{ color: '#1A1A2E' }}>{selected.child?.name_th}</strong></span>
            <span>🏫 <strong style={{ color: '#1A1A2E' }}>{selected.cohort?.name}</strong></span>
          </div>
        )}

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">วันเริ่มเรียน <span style={{ color: '#E85C5C' }}>*</span></label>
            <input className="form-input" type="date" value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              disabled={modal === 'edit'} />
          </div>
          <div className="form-group">
            <label className="form-label">วันสิ้นสุด</label>
            <input className="form-input" type="date" value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              placeholder="ปล่อยว่าง = ปัจจุบัน" />
          </div>
        </div>

        {/* Graduated checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form.graduated ? '#EBF7F0' : '#F9FAFB', borderRadius: 8, transition: 'all 0.15s' }}>
          <input type="checkbox" checked={form.graduated} onChange={e => setForm(f => ({ ...f, graduated: e.target.checked }))}
            style={{ width: 18, height: 18, cursor: 'pointer' }} />
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: form.graduated ? '#4CAF76' : '#6B7280' }}>
              🎓 สำเร็จการศึกษาแล้ว
            </span>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>ติ๊กเมื่อนักเรียนจบการศึกษาจากห้องนี้</p>
          </div>
        </label>
      </Modal>

      <Modal open={modal === 'delete'} title="ยืนยันการลบ"
        onClose={() => setModal(null)} onConfirm={handleDelete}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>
          ลบการลงทะเบียนของ <strong>{selected?.child?.name_th}</strong>{' '}
          ออกจาก <strong>{selected?.cohort?.name}</strong>?
        </p>
      </Modal>
    </>
  );
}
