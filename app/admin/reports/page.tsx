'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  DailyReport, MilkStatus, ExcretionType, ExcretionAction,
  ChildExcretion, Daily, Child, Cohort, BehaviorCategory, BehaviorItem, AppUser,
} from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2, Plus, X, MessageSquare } from 'lucide-react';

/* ─── constants ── */
const AL: Record<MilkStatus, string> = { all: 'หมด', some: 'บางส่วน', not_must: 'ไม่จำเป็น', skip: 'ข้าม' };
const AC: Record<MilkStatus, string> = { all: 'badge-active', some: 'badge-leave', not_must: 'badge-inactive', skip: 'badge-inactive' };
const ET: Record<ExcretionType,   string> = { pee: '💛 ปัสสาวะ', poo: '💩 อุจจาระ' };
const EA: Record<ExcretionAction, string> = { diaper: '🩱 ผ้าอ้อม', potty: '🚽 กระโถน' };

const EMPTY_FORM = {
  cohort_id: '', daily_id: '', child_id: '',
  nap_from: '', nap_to: '',
  milk1: 'skip' as MilkStatus, milk1_note: '',
  milk2: 'skip' as MilkStatus, milk2_note: '',
  food_amount: 'skip' as MilkStatus, food_note: '',
  fruit_amount: 'skip' as MilkStatus, fruit_note: '',
  note: '',
  created_by: '' as string,
};
const EMPTY_EX = { time: '', type: 'pee' as ExcretionType, action: 'potty' as ExcretionAction };

type BehaviorScore = { item_id: string; score: number | null; note: string };
type ExLocal = ChildExcretion & { _new?: boolean; _del?: boolean };

/* ─── FaceIcon ── */
const FACES = [
  { score: 1, emoji: '😐', label: 'ควรส่งเสริม', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { score: 2, emoji: '🙂', label: 'ทำได้ดี',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { score: 3, emoji: '😄', label: 'ดีเยี่ยม',    color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
];

/* ─── AmountSelect with optional note ── */
function AmountSelect({ label, value, noteValue, onAmountChange, onNoteChange }: {
  label: string;
  value: MilkStatus;
  noteValue: string;
  onAmountChange: (v: MilkStatus) => void;
  onNoteChange: (v: string) => void;
}) {
  const [showNote, setShowNote] = useState(!!noteValue);
  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        <button type="button"
          onClick={() => setShowNote(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: showNote ? '#F0EEFF' : 'transparent', border: 'none', borderRadius: 99, padding: '3px 8px', cursor: 'pointer', color: showNote ? '#6C5CE7' : '#9CA3AF', fontSize: 12, fontFamily: 'Sarabun, sans-serif' }}>
          <MessageSquare size={12} /> {showNote ? 'ซ่อน' : 'หมายเหตุ'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(Object.entries(AL) as [MilkStatus, string][]).map(([v, l]) => (
          <button key={v} type="button" onClick={() => onAmountChange(v)}
            className={`badge ${AC[v]}`}
            style={{ cursor: 'pointer', padding: '5px 12px', fontSize: 13, border: value === v ? '2px solid currentColor' : '2px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>
      {showNote && (
        <input className="form-input" style={{ marginTop: 6 }}
          placeholder="หมายเหตุ..."
          value={noteValue}
          onChange={e => onNoteChange(e.target.value)} />
      )}
    </div>
  );
}

/* ─── ScoreInput: FaceIcon + optional note ── */
function ScoreInput({ item, score, onChange, onNoteChange }: {
  item: BehaviorItem;
  score: BehaviorScore | undefined;
  onChange: (item_id: string, score: number | null) => void;
  onNoteChange: (item_id: string, note: string) => void;
}) {
  const val = score?.score ?? null;
  const [showNote, setShowNote] = useState(!!(score?.note));
  const max = Math.min(item.max_score, 3); // cap at 3 for FaceIcon

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 13 }}>
          <span>{item.name_th}</span>
          <span style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 6 }}>{item.name_en}</span>
        </div>
        {/* Face buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {FACES.slice(0, max).map(f => {
            const active = val === f.score;
            return (
              <button key={f.score} type="button"
                onClick={() => onChange(item.id, active ? null : f.score)}
                title={f.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: active ? `2px solid ${f.color}` : '2px solid transparent',
                  background: active ? f.bg : '#F9FAFB',
                  cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', transform: active ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: active ? `0 0 0 3px ${f.border}` : 'none',
                }}>
                {f.emoji}
              </button>
            );
          })}
          {/* note toggle */}
          <button type="button"
            onClick={() => setShowNote(s => !s)}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: showNote ? '#F0EEFF' : '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showNote ? '#6C5CE7' : '#9CA3AF' }}>
            <MessageSquare size={12} />
          </button>
        </div>
      </div>
      {/* active label */}
      {val !== null && (
        <div style={{ marginTop: 4, paddingLeft: 2 }}>
          <span style={{ fontSize: 11, color: FACES[val - 1]?.color, fontWeight: 600 }}>
            {FACES[val - 1]?.label}
          </span>
        </div>
      )}
      {/* note input */}
      {showNote && (
        <input className="form-input" style={{ marginTop: 6 }}
          placeholder="หมายเหตุพฤติกรรม..."
          value={score?.note ?? ''}
          onChange={e => onNoteChange(item.id, e.target.value)} />
      )}
    </div>
  );
}

/* ─── Page ── */
const DEFAULT_TEACHER_NAME = 'เบียร์';

export default function ReportsPage() {
  const [data, setData]           = useState<DailyReport[]>([]);
  const [cohorts, setCohorts]     = useState<Cohort[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [modal, setModal]         = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected]   = useState<DailyReport | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  const [dailiesForCohort, setDailiesForCohort]   = useState<Daily[]>([]);
  const [childrenForCohort, setChildrenForCohort] = useState<Child[]>([]);
  const [selectedDaily, setSelectedDaily]         = useState<Daily | null>(null);
  const [behaviorsForCohort, setBehaviorsForCohort] = useState<BehaviorCategory[]>([]);
  const [teachers, setTeachers]   = useState<AppUser[]>([]);
  const [scores, setScores]     = useState<BehaviorScore[]>([]);
  const [excretions, setExcretions] = useState<ExLocal[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      const res = await fetch(`/api/daily-reports?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่ได้');
      setData(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    fetch('/api/cohorts').then(r => r.json()).then(j => setCohorts(j.data ?? []));
    fetch('/api/users?role=teacher').then(r => r.json()).then(j => {
      const ts: AppUser[] = j.data ?? [];
      setTeachers(ts);
      // set default เป็นครูเบียร์
      const beer = ts.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
      if (beer) setForm(f => ({ ...f, created_by: beer.id }));
    });
  }, []);

  useEffect(() => {
    if (!form.cohort_id) { setDailiesForCohort([]); setChildrenForCohort([]); setBehaviorsForCohort([]); setSelectedDaily(null); return; }
    fetch(`/api/daily?cohort_id=${form.cohort_id}`).then(r => r.json()).then(j => setDailiesForCohort(j.data ?? []));
    fetch(`/api/enrollments?cohort_id=${form.cohort_id}`).then(r => r.json()).then(j => {
      setChildrenForCohort((j.data ?? []).map((e: { child?: Child }) => e.child).filter(Boolean) as Child[]);
    });
    fetch(`/api/behavior-categories?cohort_id=${form.cohort_id}`).then(r => r.json()).then(j => setBehaviorsForCohort(j.data ?? []));
  }, [form.cohort_id]);

  useEffect(() => {
    setSelectedDaily(dailiesForCohort.find(d => d.id === form.daily_id) ?? null);
  }, [form.daily_id, dailiesForCohort]);

  const openAdd = () => {
    const beer = teachers.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
    setForm({ ...EMPTY_FORM, created_by: beer?.id ?? teachers[0]?.id ?? '' });
    setScores([]); setExcretions([]); setSelectedDaily(null); setModal('add');
  };

  const openEdit = async (r: DailyReport) => {
    setSelected(r);
    setSelectedDaily(r.daily as Daily ?? null);
    setExcretions(r.excretions ?? []);
    setScores([]);
    setBehaviorsForCohort([]);
    const cohortId = (r.daily as Daily & { cohort?: { id: string } })?.cohort?.id ?? '';
    setForm({
      cohort_id: cohortId, daily_id: r.daily_id, child_id: r.child_id,
      nap_from: r.nap_from ?? '', nap_to: r.nap_to ?? '',
      milk1: r.milk1, milk1_note: r.milk1_note ?? '',
      milk2: r.milk2, milk2_note: r.milk2_note ?? '',
      food_amount: r.food_amount, food_note: r.food_note ?? '',
      fruit_amount: r.fruit_amount, fruit_note: r.fruit_note ?? '',
      note: r.note ?? '',
      created_by: r.created_by ?? '',
    });
    if (cohortId) {
      fetch(`/api/behavior-categories?cohort_id=${cohortId}`).then(res => res.json()).then(j => setBehaviorsForCohort(j.data ?? []));
    }
    fetch(`/api/behavior-scores?daily_id=${r.daily_id}&child_id=${r.child_id}`).then(res => res.json()).then(j => {
      setScores((j.data ?? []).map((s: { item_id: string; score: number | null; note: string }) => ({ item_id: s.item_id, score: s.score, note: s.note ?? '' })));
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (modal === 'add' && (!form.daily_id || !form.child_id)) { alert('กรุณาเลือกวันและนักเรียน'); return; }
    setSaving(true);
    try {
      let reportId: string;
      const body = {
        ...form,
        nap_from: form.nap_from || null, nap_to: form.nap_to || null,
        milk1_note: form.milk1_note || null, milk2_note: form.milk2_note || null,
        food_note: form.food_note || null, fruit_note: form.fruit_note || null,
        note: form.note || null,
        created_by: form.created_by || null,
        updated_by: form.created_by || null,
      };
      if (modal === 'add') {
        const res = await fetch('/api/daily-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        reportId = json.data.id;
      } else {
        const res = await fetch(`/api/daily-reports/${selected!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        reportId = selected!.id;
      }
      const daily_id = form.daily_id || selected!.daily_id;
      const child_id = form.child_id || selected!.child_id;
      await Promise.all(excretions.filter(ex => ex._del && !ex._new).map(ex => fetch(`/api/excretions/${ex.id}`, { method: 'DELETE' })));
      await Promise.all(excretions.filter(ex => ex._new && !ex._del).map(ex => fetch('/api/excretions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily_id, child_id, time: ex.time || null, type: ex.type, action: ex.action }) })));
      if (scores.length > 0) {
        await Promise.all(scores.filter(s => s.score !== null).map(s => fetch('/api/behavior-scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily_id, child_id, item_id: s.item_id, score: s.score, note: s.note || null }) })));
      }
      void reportId;
      setModal(null); fetchData();
    } catch (e) { alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/daily-reports/${selected!.id}`, { method: 'DELETE' });
      if (res.status !== 204) { const j = await res.json(); throw new Error(j.error); }
      setModal(null); fetchData();
    } catch (e) { alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const addEx = () => setExcretions(p => [...p, { ...EMPTY_EX, id: `_n_${Date.now()}`, daily_id: '', child_id: '', created_at: '', _new: true }]);
  const delEx = (id: string) => setExcretions(p => p.map(ex => ex.id === id ? { ...ex, _del: true } : ex));
  const updEx = (id: string, patch: Partial<ExLocal>) => setExcretions(p => p.map(ex => ex.id === id ? { ...ex, ...patch } : ex));

  const setScore = (item_id: string, score: number | null) =>
    setScores(p => { const rest = p.filter(s => s.item_id !== item_id); return score === null ? rest : [...rest, { item_id, score, note: p.find(s => s.item_id === item_id)?.note ?? '' }]; });
  const setScoreNote = (item_id: string, note: string) =>
    setScores(p => p.map(s => s.item_id === item_id ? { ...s, note } : s));

  const visibleEx = excretions.filter(ex => !ex._del);

  /* ─── section header ─ */
  const Sec = ({ emoji, label, color }: { emoji: string; label: string; color: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{emoji} {label}</p>
  );

  return (
    <>
      {error && <div style={{ margin: '16px 32px 0', padding: '10px 14px', background: '#FDECEC', borderRadius: 8, color: '#E85C5C', fontSize: 13 }}>⚠️ {error}</div>}

      <CrudTable<DailyReport>
        title="รายงานรายวัน"
        description="บันทึกการนอน นม อาหาร การขับถ่าย และพฤติกรรม"
        loading={loading} onRefresh={fetchData}
        columns={[
          { key: 'child', label: 'นักเรียน', render: r => (
            <div>
              <div style={{ fontWeight: 500 }}>{r.child?.name_th ?? '-'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.daily?.cohort?.name}</div>
            </div>
          )},
          { key: 'date', label: 'วันที่', hideOnMobile: true, render: r => r.daily?.date ? new Date(r.daily.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-' },
          { key: 'milk1', label: 'นม 1', render: r => <span className={`badge ${AC[r.milk1]}`}>{AL[r.milk1]}</span> },
          { key: 'food_amount', label: 'อาหาร', hideOnMobile: true, render: r => <span className={`badge ${AC[r.food_amount]}`}>{AL[r.food_amount]}</span> },
          { key: 'excretions', label: '🚽', hideOnMobile: true, render: r => {
            const exs = r.excretions ?? [];
            if (!exs.length) return <span style={{ color: '#D1D5DB' }}>—</span>;
            return <div style={{ display: 'flex', gap: 4 }}>{exs.map((ex, i) => <span key={i} style={{ fontSize: 11, background: ex.type === 'poo' ? '#FEF6E6' : '#EBF4FA', color: ex.type === 'poo' ? '#F5A623' : '#4A90B8', padding: '2px 6px', borderRadius: 99 }}>{ex.type === 'pee' ? '💛' : '💩'} {ex.time?.slice(0,5)}</span>)}</div>;
          }},
        ]}
        data={data}
        onAdd={openAdd} addLabel="เพิ่มรายงาน"
        searchValue={search} onSearchChange={setSearch} searchPlaceholder="ค้นหาชื่อนักเรียน..."
        actions={row => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}><Pencil size={13} /></button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /></button>
          </div>
        )}
      />

      {/* ════════ Modal ════════ */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'เพิ่มรายงานรายวัน' : `แก้ไขรายงาน — ${selected?.child?.name_th}`}
        onClose={() => setModal(null)} onConfirm={handleSave}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}>

        {/* ── cohort (add) ── */}
        {modal === 'add' && (
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="🏫" label="1 · เลือกรุ่น" color="#9CA3AF" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cohorts.map(c => (
                <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, cohort_id: c.id, daily_id: '', child_id: '' }))}
                  style={{ padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun,sans-serif', background: form.cohort_id === c.id ? '#1A1A2E' : '#FFFFFF', color: form.cohort_id === c.id ? 'white' : '#6B7280', fontWeight: form.cohort_id === c.id ? 700 : 400, boxShadow: form.cohort_id === c.id ? 'none' : '0 0 0 1px #E5E7EB', transition: 'all .15s' }}>
                  {c.name}<span style={{ marginLeft: 4, fontSize: 11, opacity: 0.6 }}>({c.level})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── day (add) ── */}
        {modal === 'add' && form.cohort_id && (
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="📅" label="2 · เลือกวัน" color="#9CA3AF" />
            {dailiesForCohort.length === 0 ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>ยังไม่มีบันทึกในรุ่นนี้</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dailiesForCohort.map(d => (
                  <button key={d.id} type="button" onClick={() => setForm(f => ({ ...f, daily_id: d.id }))}
                    style={{ padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Sarabun,sans-serif', background: form.daily_id === d.id ? '#E8754A' : '#FFFFFF', color: form.daily_id === d.id ? 'white' : '#6B7280', fontWeight: form.daily_id === d.id ? 700 : 400, boxShadow: form.daily_id === d.id ? 'none' : '0 0 0 1px #E5E7EB', transition: 'all .15s' }}>
                    {new Date(d.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* food/fruit preview */}
        {selectedDaily && (selectedDaily.activity || selectedDaily.food || selectedDaily.fruit) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedDaily.activity && <div style={{ flex: '1 1 100%', background: '#EBF4FA', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4A90B8', marginBottom: 4 }}>🎨 กิจกรรม</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.activity}</p></div>}
            {selectedDaily.food   && <div style={{ flex: 1, background: '#EBF7F0', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4CAF76', marginBottom: 4 }}>🍱 อาหาร</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.food}</p></div>}
            {selectedDaily.fruit  && <div style={{ flex: 1, background: '#EBF7F0', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4CAF76', marginBottom: 4 }}>🍎 ผลไม้</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.fruit}</p></div>}
          </div>
        )}

        {/* ── student (add) ── */}
        {modal === 'add' && form.daily_id && (
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="👧" label="3 · เลือกนักเรียน" color="#9CA3AF" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {childrenForCohort.map(c => (
                <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, child_id: c.id }))}
                  style={{ padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun,sans-serif', background: form.child_id === c.id ? '#6C5CE7' : '#FFFFFF', color: form.child_id === c.id ? 'white' : '#6B7280', fontWeight: form.child_id === c.id ? 700 : 400, boxShadow: form.child_id === c.id ? 'none' : '0 0 0 1px #E5E7EB', transition: 'all .15s' }}>
                  {c.name_th}
                </button>
              ))}
            </div>
          </div>
        )}

        {modal === 'edit' && selected && (
          <div style={{ padding: '10px 14px', background: '#F7F5F2', borderRadius: 8, fontSize: 14, color: '#6B7280', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>👧 <strong style={{ color: '#1A1A2E' }}>{selected.child?.name_th}</strong></span>
            {selected.daily?.date && <span>📅 <strong style={{ color: '#1A1A2E' }}>{new Date(selected.daily.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></span>}
          </div>
        )}

        {/* ── Teacher selector ── */}
        <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            👩‍🏫 ครูผู้บันทึก
          </p>
          {teachers.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>
              ยังไม่มีครูในระบบ — เพิ่มได้ที่{' '}
              <a href="/admin/users" style={{ color: '#6C5CE7', textDecoration: 'underline' }}>จัดการผู้ใช้</a>
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teachers.map(t => {
                const active = form.created_by === t.id;
                return (
                  <button key={t.id} type="button"
                    onClick={() => setForm(f => ({ ...f, created_by: t.id }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 99, border: 'none',
                      cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun,sans-serif',
                      background: active ? '#1A1A2E' : '#FFFFFF',
                      color: active ? 'white' : '#6B7280',
                      fontWeight: active ? 700 : 400,
                      boxShadow: active ? 'none' : '0 0 0 1px #E5E7EB',
                      transition: 'all .15s',
                    }}>
                    {t.picture_url
                      ? <img src={t.picture_url} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>
                          {t.display_name?.slice(0,1) ?? '?'}
                        </div>
                    }
                    {t.display_name ?? t.line_user_id?.slice(0, 8) ?? "(ไม่มีชื่อ)"}
                    {t.display_name?.includes(DEFAULT_TEACHER_NAME) && !active && (
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>(default)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Nap ── */}
        <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
          <Sec emoji="😴" label="การนอน" color="#9CA3AF" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">เริ่มนอน</label><input className="form-input" type="time" value={form.nap_from} onChange={e => setForm(f => ({ ...f, nap_from: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">ตื่นนอน</label><input className="form-input" type="time" value={form.nap_to} onChange={e => setForm(f => ({ ...f, nap_to: e.target.value }))} /></div>
          </div>
        </div>

        {/* ── Milk ── */}
        <div style={{ background: '#FEF0EB', borderRadius: 8, padding: '14px 16px' }}>
          <Sec emoji="🍼" label="นม" color="#E8754A" />
          <AmountSelect label="นม มื้อ 1" value={form.milk1} noteValue={form.milk1_note}
            onAmountChange={v => setForm(f => ({ ...f, milk1: v }))}
            onNoteChange={v => setForm(f => ({ ...f, milk1_note: v }))} />
          <div style={{ marginTop: 10 }}>
            <AmountSelect label="นม มื้อ 2" value={form.milk2} noteValue={form.milk2_note}
              onAmountChange={v => setForm(f => ({ ...f, milk2: v }))}
              onNoteChange={v => setForm(f => ({ ...f, milk2_note: v }))} />
          </div>
        </div>

        {/* ── Food & Fruit ── */}
        <div style={{ background: '#EBF7F0', borderRadius: 8, padding: '14px 16px' }}>
          <Sec emoji="🍱" label="ปริมาณที่รับประทาน" color="#4CAF76" />
          <AmountSelect label="ปริมาณอาหาร" value={form.food_amount} noteValue={form.food_note}
            onAmountChange={v => setForm(f => ({ ...f, food_amount: v }))}
            onNoteChange={v => setForm(f => ({ ...f, food_note: v }))} />
          <div style={{ marginTop: 10 }}>
            <AmountSelect label="ปริมาณผลไม้" value={form.fruit_amount} noteValue={form.fruit_note}
              onAmountChange={v => setForm(f => ({ ...f, fruit_amount: v }))}
              onNoteChange={v => setForm(f => ({ ...f, fruit_note: v }))} />
          </div>
        </div>

        {/* ── Excretions ── */}
        <div style={{ background: '#F0EEFF', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Sec emoji="🚽" label="การขับถ่าย" color="#6C5CE7" />
            <button type="button" className="btn btn-sm" style={{ background: '#6C5CE7', color: 'white', fontSize: 12 }} onClick={addEx}><Plus size={12} /> เพิ่ม</button>
          </div>
          {visibleEx.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>ยังไม่มีบันทึก</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleEx.map(ex => (
              <div key={ex.id} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="time" className="form-input" value={ex.time ?? ''} onChange={e => updEx(ex.id, { time: e.target.value || null })} style={{ width: 100, padding: '5px 8px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['pee', 'poo'] as ExcretionType[]).map(t => (
                    <button key={t} type="button" onClick={() => updEx(ex.id, { type: t })}
                      style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.type === t ? (t === 'pee' ? '#EBF4FA' : '#FEF6E6') : '#F3F4F6', color: ex.type === t ? (t === 'pee' ? '#4A90B8' : '#F5A623') : '#9CA3AF', fontWeight: ex.type === t ? 600 : 400 }}>
                      {ET[t]}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['diaper', 'potty'] as ExcretionAction[]).map(a => (
                    <button key={a} type="button" onClick={() => updEx(ex.id, { action: a })}
                      style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.action === a ? '#F0EEFF' : '#F3F4F6', color: ex.action === a ? '#6C5CE7' : '#9CA3AF', fontWeight: ex.action === a ? 600 : 400 }}>
                      {EA[a]}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => delEx(ex.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Behaviors ── */}
        {behaviorsForCohort.map(cat => (
          <div key={cat.id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="🧠" label={`${cat.name_th}  ${cat.name_en}`} color="#6C5CE7" />
            {(cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.map(item => (
              <ScoreInput key={item.id} item={item}
                score={scores.find(s => s.item_id === item.id)}
                onChange={setScore}
                onNoteChange={setScoreNote} />
            ))}
          </div>
        ))}

        {/* ── Note ── */}
        <div className="form-group">
          <label className="form-label">💬 ข้อความถึงผู้ปกครอง</label>
          <textarea className="form-input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ resize: 'vertical' }} placeholder="เพิ่มเติม..." />
        </div>
      </Modal>

      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={handleDelete} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ลบรายงานของ <strong>{selected?.child?.name_th}</strong>?</p>
      </Modal>
    </>
  );
}
