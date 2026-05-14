'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Cohort, Enrollment, Child } from '@/types';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Plus, Trash2, GraduationCap, Users, Calendar } from 'lucide-react';

export default function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [cohort, setCohort]         = useState<Cohort | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState<'add' | 'delete' | 'graduate' | null>(null);
  const [selectedEnroll, setSelectedEnroll] = useState<Enrollment | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [startDate, setStartDate]   = useState('');
  const [search, setSearch]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cohortRes, enrollRes] = await Promise.all([
        fetch(`/api/cohorts/${id}`),
        fetch(`/api/enrollments?cohort_id=${id}`),
      ]);
      const cohortJson = await cohortRes.json();
      const enrollJson = await enrollRes.json();
      setCohort(cohortJson.data);
      setEnrollments(enrollJson.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Load all children for the add modal
  useEffect(() => {
    fetch('/api/children').then(r => r.json()).then(j => setAllChildren(j.data ?? []));
  }, []);

  const enrolledChildIds = new Set(enrollments.map(e => e.child_id));
  const availableChildren = allChildren.filter(c =>
    !enrolledChildIds.has(c.id) &&
    (c.name_th?.includes(search) || c.name_en?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleChild = (id: string) =>
    setSelectedChildIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleAddStudents = async () => {
    if (!selectedChildIds.length || !startDate) { alert('เลือกนักเรียนและวันเริ่มต้น'); return; }
    setSaving(true);
    try {
      await Promise.all(
        selectedChildIds.map(child_id =>
          fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ child_id, cohort_id: id, start_date: startDate }),
          })
        )
      );
      setModal(null);
      setSelectedChildIds([]);
      setSearch('');
      load();
    } catch { alert('เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedEnroll) return;
    setSaving(true);
    try {
      await fetch(`/api/enrollments/${selectedEnroll.id}`, { method: 'DELETE' });
      setModal(null);
      load();
    } catch { alert('ลบไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleGraduate = async () => {
    if (!selectedEnroll) return;
    setSaving(true);
    try {
      await fetch(`/api/enrollments/${selectedEnroll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graduated: true, end_date: new Date().toISOString().split('T')[0] }),
      });
      setModal(null);
      load();
    } catch { alert('เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const active  = enrollments.filter(e => !e.graduated);
  const grads   = enrollments.filter(e => e.graduated);

  const StudentRow = ({ e }: { e: Enrollment }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 20px', borderBottom: '1px solid #F3F4F6',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: e.graduated ? '#EBF7F0' : '#FEF0EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {e.graduated ? '🎓' : '👧'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{e.child?.name_th ?? '-'}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{e.child?.name_en}</div>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Calendar size={11} />
        {new Date(e.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
      </div>
      {e.graduated ? (
        <span className="badge badge-active" style={{ fontSize: 11 }}>🎓 จบแล้ว</span>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#4CAF76', borderColor: '#4CAF76', fontSize: 12 }}
            onClick={() => { setSelectedEnroll(e); setModal('graduate'); }}
          >
            <GraduationCap size={12} /> จบการศึกษา
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => { setSelectedEnroll(e); setModal('delete'); }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ height: 32, width: 200, background: '#F3F4F6', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
        {[1,2,3].map(i => <div key={i} style={{ height: 60, background: '#F3F4F6', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />)}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px' }}>
        <button
          onClick={() => router.push('/admin/cohorts')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, marginBottom: 12, padding: 0 }}
        >
          <ArrowLeft size={14} /> กลับรายการห้องเรียน
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Prompt, sans-serif' }}>
                {cohort?.name ?? '—'}
              </h1>
              <span className="badge badge-teacher">{cohort?.level}</span>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
              ปีการศึกษา {cohort?.academic_year} ·{' '}
              {cohort?.start_date && new Date(cohort.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              {' – '}
              {cohort?.end_date && new Date(cohort.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedChildIds([]);
              setSearch('');
              setStartDate(cohort?.start_date ?? '');
              setModal('add');
            }}
          >
            <Plus size={15} /> เพิ่มนักเรียน
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {[
            { label: 'กำลังเรียน', value: active.length, icon: '📚', color: '#E8754A', bg: '#FEF0EB' },
            { label: 'จบการศึกษา', value: grads.length, icon: '🎓', color: '#4CAF76', bg: '#EBF7F0' },
            { label: 'ทั้งหมด', value: enrollments.length, icon: '👥', color: '#4A90B8', bg: '#EBF4FA' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: s.bg, borderRadius: 99 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: s.color, fontFamily: 'Prompt, sans-serif' }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Active students */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} style={{ color: '#E8754A' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>นักเรียนที่กำลังเรียน ({active.length})</h3>
          </div>
          {active.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
              ยังไม่มีนักเรียน — กด &ldquo;เพิ่มนักเรียน&rdquo; เพื่อเริ่มต้น
            </div>
          ) : (
            active.map(e => <StudentRow key={e.id} e={e} />)
          )}
        </div>

        {/* Graduated */}
        {grads.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={15} style={{ color: '#4CAF76' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>จบการศึกษาแล้ว ({grads.length})</h3>
            </div>
            {grads.map(e => <StudentRow key={e.id} e={e} />)}
          </div>
        )}
      </div>

      {/* ── Add Students Modal ── */}
      <Modal
        open={modal === 'add'}
        title={`เพิ่มนักเรียนเข้า ${cohort?.name}`}
        onClose={() => setModal(null)}
        onConfirm={handleAddStudents}
        confirmLabel={saving ? 'กำลังบันทึก...' : `เพิ่ม ${selectedChildIds.length || ''} คน`}
      >
        <div className="form-group">
          <label className="form-label">วันเริ่มเรียน <span style={{ color: '#E85C5C' }}>*</span></label>
          <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">ค้นหานักเรียน</label>
          <input
            className="form-input"
            placeholder="ชื่อนักเรียน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {availableChildren.length === 0 ? (
          <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: 8, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            {allChildren.length === 0 ? 'ยังไม่มีนักเรียนในระบบ' : 'นักเรียนทุกคนลงทะเบียนในห้องนี้แล้ว'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
              เลือกได้หลายคน · เลือกแล้ว {selectedChildIds.length} คน
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              maxHeight: 220, overflowY: 'auto', padding: 4,
            }}>
              {availableChildren.map(c => {
                const picked = selectedChildIds.includes(c.id);
                return (
                  <button
                    key={c.id} type="button"
                    onClick={() => toggleChild(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 99, border: 'none',
                      cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun, sans-serif',
                      background: picked ? '#1A1A2E' : '#F3F4F6',
                      color: picked ? 'white' : '#6B7280',
                      fontWeight: picked ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {picked && <span style={{ fontSize: 11 }}>✓</span>}
                    {c.name_th}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Modal>

      {/* Graduate Modal */}
      <Modal
        open={modal === 'graduate'}
        title="ยืนยันจบการศึกษา"
        onClose={() => setModal(null)}
        onConfirm={handleGraduate}
        confirmLabel={saving ? 'กำลังบันทึก...' : '🎓 ยืนยันจบการศึกษา'}
      >
        <p style={{ color: '#6B7280' }}>
          บันทึกว่า <strong>{selectedEnroll?.child?.name_th}</strong> จบการศึกษาจาก{' '}
          <strong>{cohort?.name}</strong>?
        </p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={modal === 'delete'}
        title="ยืนยันการลบ"
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'}
        confirmDanger
      >
        <p style={{ color: '#6B7280' }}>
          ลบ <strong>{selectedEnroll?.child?.name_th}</strong>{' '}
          ออกจาก <strong>{cohort?.name}</strong>?
        </p>
      </Modal>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}
