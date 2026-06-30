'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Cohort, Enrollment, Child } from '@/types';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Plus, Trash2, GraduationCap, Users, Calendar, BookOpen } from 'lucide-react';
import { User } from '@/components/icons';

/* ─── Helper: Format date as YYYY-MM-DD ── */
const formatDateForInput = (dateStr: string | Date): string => {
  if (!dateStr) return '';
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : '';
};

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
        fetch(`/api/enrollments?cohort_id=${id}&include_hidden=true`),
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
  const availableChildren = allChildren.filter(c => {
    if (enrolledChildIds.has(c.id)) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      c.nickname_th?.toLowerCase().includes(searchLower) ||
      c.nickname_en?.toLowerCase().includes(searchLower) ||
      c.firstname_th?.toLowerCase().includes(searchLower) ||
      c.firstname_en?.toLowerCase().includes(searchLower) ||
      c.lastname_th?.toLowerCase().includes(searchLower) ||
      c.lastname_en?.toLowerCase().includes(searchLower) ||
      c.name_th?.toLowerCase().includes(searchLower) ||
      c.name_en?.toLowerCase().includes(searchLower)
    );
  });

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

  const StudentRow = ({ e }: { e: Enrollment }) => {
    // แสดงชื่อตามลำดับความสำคัญ
    const displayName = e.child?.nickname_th || '-';
    const displayNameEn = e.child?.nickname_en || '-';
    const isHidden = e.hidden || false;
    
    const handleToggleHidden = async () => {
      const newHiddenState = !isHidden;
      
      // Optimistic update - update state immediately
      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === e.id 
          ? { ...enrollment, hidden: newHiddenState } 
          : enrollment
      ));
      
      try {
        await fetch(`/api/enrollments/${e.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hidden: newHiddenState }),
        });
      } catch {
        // Revert on error
        setEnrollments(prev => prev.map(enrollment => 
          enrollment.id === e.id 
            ? { ...enrollment, hidden: isHidden } 
            : enrollment
        ));
        alert('เกิดข้อผิดพลาด');
      }
    };
    
    return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
      opacity: isHidden ? 0.5 : 1,
      transition: 'opacity 0.2s ease'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: e.graduated ? '#EBF7F0' : (isHidden ? '#F3F4F6' : '#FEF0EB'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s ease'
      }}>
        {e.graduated ? <GraduationCap size={18} color="#4CAF76" /> : <User size={18} color={isHidden ? '#94a3b8' : '#E8754A'} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          {displayName}
          {isHidden && (
            <span style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: '#fef3c7',
              color: '#92400e',
              fontWeight: 600
            }}>
              ซ่อน
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{displayNameEn}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Calendar size={11} />
        {new Date(e.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
      </div>
      {e.graduated ? (
        <span className="badge badge-active" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <GraduationCap size={11} /> จบแล้ว
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ 
              color: isHidden ? '#6366f1' : '#f59e0b', 
              borderColor: isHidden ? '#6366f1' : '#f59e0b', 
              fontSize: 12 
            }}
            onClick={handleToggleHidden}
            title={isHidden ? 'แสดงในรายการเลือก' : 'ซ่อนจากรายการเลือก'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isHidden ? (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </>
              ) : (
                <>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </>
              )}
            </svg>
            {isHidden ? 'แสดง' : 'ซ่อน'}
          </button>
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
  )};


  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ height: 32, width: 200, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
        {[1,2,3].map(i => <div key={i} style={{ height: 60, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />)}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '20px 32px' }}>
        <button
          onClick={() => router.push('/admin/cohorts')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, padding: 0 }}
        >
          <ArrowLeft size={14} /> กลับรายการห้องเรียน
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Prompt, sans-serif' }}>
                {cohort?.name ?? '—'}
              </h1>
              <span className="badge badge-teacher">{cohort?.level}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
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
            { label: 'กำลังเรียน', value: active.length, icon: <BookOpen size={16} color="#E8754A" />, color: '#E8754A', bg: '#FEF0EB' },
            { label: 'จบการศึกษา', value: grads.length, icon: <GraduationCap size={16} color="#4CAF76" />, color: '#4CAF76', bg: '#EBF7F0' },
            { label: 'ทั้งหมด', value: enrollments.length, icon: <Users size={16} color="#4A90B8" />, color: '#4A90B8', bg: '#EBF4FA' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: s.bg, borderRadius: 99 }}>
              {s.icon}
              <span style={{ fontWeight: 700, fontSize: 18, color: s.color, fontFamily: 'Prompt, sans-serif' }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Active students */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} style={{ color: '#E8754A' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>นักเรียนที่กำลังเรียน ({active.length})</h3>
          </div>
          {active.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Users size={32} color="#9CA3AF" />
              </div>
              ยังไม่มีนักเรียน — กด &ldquo;เพิ่มนักเรียน&rdquo; เพื่อเริ่มต้น
            </div>
          ) : (
            active.map(e => <StudentRow key={e.id} e={e} />)
          )}
        </div>

        {/* Graduated */}
        {grads.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            {allChildren.length === 0 ? 'ยังไม่มีนักเรียนในระบบ' : 'นักเรียนทุกคนลงทะเบียนในห้องนี้แล้ว'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              เลือกได้หลายคน · เลือกแล้ว {selectedChildIds.length} คน
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              maxHeight: 220, overflowY: 'auto', padding: 4,
            }}>
              {availableChildren.map(c => {
                const picked = selectedChildIds.includes(c.id);
                const displayName = c.nickname_th || c.nickname_en || c.firstname_th || c.firstname_en || c.name_th || c.name_en || '?';
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
                    {displayName}
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
        confirmLabel={saving ? 'กำลังบันทึก...' : 'ยืนยันจบการศึกษา'}
      >
        <p style={{ color: '#6B7280' }}>
          บันทึกว่า <strong>{selectedEnroll?.child?.nickname_th || selectedEnroll?.child?.nickname_en || selectedEnroll?.child?.name_th || selectedEnroll?.child?.name_en}</strong> จบการศึกษาจาก{' '}
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
          ลบ <strong>{selectedEnroll?.child?.nickname_th || selectedEnroll?.child?.nickname_en || selectedEnroll?.child?.name_th || selectedEnroll?.child?.name_en}</strong>{' '}
          ออกจาก <strong>{cohort?.name}</strong>?
        </p>
      </Modal>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}
