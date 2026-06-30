'use client';
import React from 'react';
import { Child, Daily, BehaviorCategory, BehaviorItem, AppUser, MilkStatus, ExcretionType, ExcretionAction } from '@/types';
import { Plus, X, MessageSquare } from 'lucide-react';

type BehaviorScore = { item_id: string; score: number | null; note: string };
type ExLocal = { id: string; time: string | null; type: ExcretionType | null; action: ExcretionAction | null; _del?: boolean };

const AL: Record<MilkStatus, string> = { all: 'ทานหมด', some: 'บางส่วน', not_must: 'นิดหน่อย', skip: 'ข้าม' };
const AC: Record<MilkStatus, string> = { all: 'badge-active', some: 'badge-leave', not_must: 'badge-inactive', skip: 'badge-inactive' };
const ET: Record<ExcretionType, string> = { pee: '💛 ปัสสาวะ', poo: '💩 อุจจาระ' };
const EA: Record<ExcretionAction, string> = { diaper: '🩲 ผ้าอ้อม', potty: '🚽 กระโถน' };
const DEFAULT_TEACHER_NAME = 'เบียร์';

const FACES = [
  { score: 1, emoji: '😐', label: 'ควรส่งเสริม', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { score: 2, emoji: '🙂', label: 'ทำได้ดี', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { score: 3, emoji: '😄', label: 'ดีเยี่ยม', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
];

/* ─── section header ─ */
const Sec = ({ emoji, label, color }: { emoji: string; label: string; color: string }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{emoji} {label}</p>
);

/* ─── ScoreInput ─ */
function ScoreInput({ item, score, onChange, onNoteChange }: {
  item: BehaviorItem;
  score: BehaviorScore | undefined;
  onChange: (item_id: string, score: number | null) => void;
  onNoteChange: (item_id: string, note: string) => void;
}) {
  const val = score?.score ?? null;
  const [showNote, setShowNote] = React.useState(!!(score?.note));
  const max = Math.min(item.max_score, 3);

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 13 }}>
          <span>{item.name_th}</span>
          <span style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 6 }}>{item.name_en}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {FACES.slice(0, max).reverse().map(f => {
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
          <button type="button"
            onClick={() => setShowNote(s => !s)}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: showNote ? '#F0EEFF' : '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showNote ? '#6C5CE7' : '#9CA3AF' }}>
            <MessageSquare size={12} />
          </button>
        </div>
      </div>
      {val !== null && (
        <div style={{ marginTop: 4, paddingLeft: 2 }}>
          <span style={{ fontSize: 11, color: FACES[val - 1]?.color, fontWeight: 600 }}>
            {FACES[val - 1]?.label}
          </span>
        </div>
      )}
      {showNote && (
        <input className="form-input" style={{ marginTop: 6 }}
          placeholder="หมายเหตุพฤติกรรม..."
          value={score?.note ?? ''}
          onChange={e => onNoteChange(item.id, e.target.value)} />
      )}
    </div>
  );
}

/* ─── AmountSelect ─ */
function AmountSelect({ label, value, noteValue, onAmountChange, onNoteChange }: {
  label: string;
  value: MilkStatus;
  noteValue: string;
  onAmountChange: (v: MilkStatus) => void;
  onNoteChange: (v: string) => void;
}) {
  const [showNote, setShowNote] = React.useState(!!noteValue);
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

interface ReportModalContentProps {
  selectedDaily: Daily | null;
  childrenForCohort: Child[];
  behaviorsForCohort: BehaviorCategory[];
  teachers: AppUser[];
  reportForm: {
    child_id: string;
    nap_from: string;
    nap_to: string;
    nap_note: string;
    milk1: MilkStatus;
    milk1_note: string;
    milk2: MilkStatus;
    milk2_note: string;
    food_amount: MilkStatus;
    food_note: string;
    fruit_amount: MilkStatus;
    fruit_note: string;
    note: string;
    created_by: string;
  };
  scores: BehaviorScore[];
  excretions: ExLocal[];
  onReportFormChange: (form: any) => void;
  onScoreChange: (item_id: string, score: number | null) => void;
  onScoreNoteChange: (item_id: string, note: string) => void;
  onExcretionAdd: () => void;
  onExcretionUpdate: (id: string, patch: Partial<ExLocal>) => void;
  onExcretionDelete: (id: string) => void;
  onChildSelect?: (child_id: string) => void;
}

export default function ReportModalContent({
  selectedDaily,
  childrenForCohort,
  behaviorsForCohort,
  teachers,
  reportForm,
  scores,
  excretions,
  onReportFormChange,
  onScoreChange,
  onScoreNoteChange,
  onExcretionAdd,
  onExcretionUpdate,
  onExcretionDelete,
  onChildSelect,
}: ReportModalContentProps) {
  const visibleEx = excretions.filter(ex => !ex._del);

  // Sort behavior categories
  const sortedBehaviors = [...behaviorsForCohort].sort((a, b) => {
    const aIsConduct = a.name_en?.toLowerCase().includes('conduct');
    const bIsConduct = b.name_en?.toLowerCase().includes('conduct');
    const aIsWork = a.name_en?.toLowerCase().includes('work');
    const bIsWork = b.name_en?.toLowerCase().includes('work');
    
    if (aIsConduct && !bIsConduct) return -1;
    if (!aIsConduct && bIsConduct) return 1;
    if (aIsWork && !bIsWork) return -1;
    if (!aIsWork && bIsWork) return 1;
    return 0;
  });

  return (
    <>
      {/* Daily Info Preview */}
      {selectedDaily && (selectedDaily.activity || selectedDaily.food || selectedDaily.fruit) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedDaily.activity && <div style={{ flex: '1 1 100%', background: '#EBF4FA', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4A90B8', marginBottom: 4 }}>🎨 กิจกรรม</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.activity}</p></div>}
          {selectedDaily.food && <div style={{ flex: 1, background: '#EBF7F0', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4CAF76', marginBottom: 4 }}>🍱 อาหาร</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.food}</p></div>}
          {selectedDaily.fruit && <div style={{ flex: 1, background: '#EBF7F0', borderRadius: 8, padding: '10px 14px' }}><p style={{ fontSize: 11, fontWeight: 700, color: '#4CAF76', marginBottom: 4 }}>🍎 ผลไม้</p><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedDaily.fruit}</p></div>}
        </div>
      )}

      {/* Student Selection */}
      <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
        <Sec emoji="👧" label="เลือกนักเรียน" color="#9CA3AF" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {childrenForCohort.map(c => (
            <button key={c.id} type="button" onClick={() => {
              onReportFormChange({ ...reportForm, child_id: c.id });
              onChildSelect?.(c.id);
            }}
              style={{ padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Sarabun,sans-serif', background: reportForm.child_id === c.id ? '#6C5CE7' : '#FFFFFF', color: reportForm.child_id === c.id ? 'white' : '#6B7280', fontWeight: reportForm.child_id === c.id ? 700 : 400, boxShadow: reportForm.child_id === c.id ? 'none' : '0 0 0 1px #E5E7EB', transition: 'all .15s' }}>
              {c.name_th}
            </button>
          ))}
        </div>
      </div>

      {reportForm.child_id && (
        <>
          {/* Behaviors */}
          {sortedBehaviors.map(cat => {
            const items = (cat as BehaviorCategory & { items?: BehaviorItem[] }).items ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat.id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 8, padding: '14px 16px' }}>
                <Sec emoji="🧠" label={`${cat.name_th}  ${cat.name_en}`} color="#6C5CE7" />
                {items.map(item => (
                  <ScoreInput key={item.id} item={item}
                    score={scores.find(s => s.item_id === item.id)}
                    onChange={onScoreChange}
                    onNoteChange={onScoreNoteChange} />
                ))}
              </div>
            );
          })}

          {/* Nap */}
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="😴" label="การนอน" color="#9CA3AF" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">เริ่มนอน</label><input className="form-input" type="time" value={reportForm.nap_from} onChange={e => onReportFormChange({ ...reportForm, nap_from: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">ตื่นนอน</label><input className="form-input" type="time" value={reportForm.nap_to} onChange={e => onReportFormChange({ ...reportForm, nap_to: e.target.value })} /></div>
            </div>
            {/* Nap Note with Toggle */}
            <div className="form-group" style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>หมายเหตุ (สำหรับเด็กไม่นอน)</label>
                <button type="button"
                  onClick={() => {
                    const napNoteInput = document.getElementById('report-modal-nap-note-input');
                    if (napNoteInput) {
                      (napNoteInput as HTMLElement).style.display = 
                        (napNoteInput as HTMLElement).style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: reportForm.nap_note ? '#F0EEFF' : 'transparent', border: 'none', borderRadius: 99, padding: '3px 8px', cursor: 'pointer', color: reportForm.nap_note ? '#6C5CE7' : '#9CA3AF', fontSize: 12, fontFamily: 'Sarabun, sans-serif' }}>
                  <MessageSquare size={12} /> {reportForm.nap_note ? 'ซ่อน' : 'หมายเหตุ'}
                </button>
              </div>
              <input 
                id="report-modal-nap-note-input"
                className="form-input" 
                style={{ display: reportForm.nap_note ? 'block' : 'none' }}
                placeholder="เช่น ไม่นอน, เล่นตลอด, นอนดึก..."
                value={reportForm.nap_note}
                onChange={e => onReportFormChange({ ...reportForm, nap_note: e.target.value })} />
            </div>
          </div>

          {/* Excretions */}
          <div style={{ background: '#F0EEFF', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Sec emoji="🚽" label="การขับถ่าย" color="#6C5CE7" />
              <button type="button" className="btn btn-sm" style={{ background: '#6C5CE7', color: 'white', fontSize: 12 }} onClick={onExcretionAdd}><Plus size={12} /> เพิ่ม</button>
            </div>
            {visibleEx.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>ยังไม่มีบันทึก</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleEx.map(ex => (
                <div key={ex.id} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="time" className="form-input" value={ex.time ?? ''} onChange={e => onExcretionUpdate(ex.id, { time: e.target.value || null })} style={{ width: 100, padding: '5px 8px', fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['pee', 'poo'] as ExcretionType[]).map(t => (
                      <button key={t} type="button" onClick={() => onExcretionUpdate(ex.id, { type: t })}
                        style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.type === t ? (t === 'pee' ? '#EBF4FA' : '#FEF6E6') : '#F3F4F6', color: ex.type === t ? (t === 'pee' ? '#4A90B8' : '#F5A623') : '#9CA3AF', fontWeight: ex.type === t ? 600 : 400 }}>
                        {ET[t]}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['diaper', 'potty'] as ExcretionAction[]).map(a => (
                      <button key={a} type="button" onClick={() => onExcretionUpdate(ex.id, { action: a })}
                        style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.action === a ? '#F0EEFF' : '#F3F4F6', color: ex.action === a ? '#6C5CE7' : '#9CA3AF', fontWeight: ex.action === a ? 600 : 400 }}>
                        {EA[a]}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => onExcretionDelete(ex.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Food & Fruit */}
          <div style={{ background: '#EBF7F0', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="🍱" label="ปริมาณที่รับประทาน" color="#4CAF76" />
            <AmountSelect 
              label={selectedDaily?.food ? `🍱 ${selectedDaily.food}` : "ปริมาณอาหาร"} 
              value={reportForm.food_amount} 
              noteValue={reportForm.food_note}
              onAmountChange={v => onReportFormChange({ ...reportForm, food_amount: v })}
              onNoteChange={v => onReportFormChange({ ...reportForm, food_note: v })} />
            <div style={{ marginTop: 10 }}>
              <AmountSelect 
                label={selectedDaily?.fruit ? `🍎 ${selectedDaily.fruit}` : "ปริมาณผลไม้"} 
                value={reportForm.fruit_amount} 
                noteValue={reportForm.fruit_note}
                onAmountChange={v => onReportFormChange({ ...reportForm, fruit_amount: v })}
                onNoteChange={v => onReportFormChange({ ...reportForm, fruit_note: v })} />
            </div>
          </div>

          {/* Milk */}
          <div style={{ background: '#FEF0EB', borderRadius: 8, padding: '14px 16px' }}>
            <Sec emoji="🍼" label="นม" color="#E8754A" />
            <AmountSelect label="นม มื้อ 1" value={reportForm.milk1} noteValue={reportForm.milk1_note}
              onAmountChange={v => onReportFormChange({ ...reportForm, milk1: v })}
              onNoteChange={v => onReportFormChange({ ...reportForm, milk1_note: v })} />
            <div style={{ marginTop: 10 }}>
              <AmountSelect label="นม มื้อ 2" value={reportForm.milk2} noteValue={reportForm.milk2_note}
                onAmountChange={v => onReportFormChange({ ...reportForm, milk2: v })}
                onNoteChange={v => onReportFormChange({ ...reportForm, milk2_note: v })} />
            </div>
          </div>

          {/* Teacher selector */}
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              👩‍🏫 ครูผู้บันทึก
            </p>
            {teachers.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>ยังไม่มีครูในระบบ</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {teachers.map(t => {
                  const active = reportForm.created_by === t.id;
                  return (
                    <button key={t.id} type="button"
                      onClick={() => onReportFormChange({ ...reportForm, created_by: t.id })}
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
                        ? <img src={t.picture_url} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>
                            {t.display_name?.slice(0, 1) ?? '?'}
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

          {/* Note */}
          <div className="form-group">
            <label className="form-label">💬 ข้อความถึงผู้ปกครอง</label>
            <textarea className="form-input" rows={2} value={reportForm.note} onChange={e => onReportFormChange({ ...reportForm, note: e.target.value })} style={{ resize: 'vertical' }} placeholder="เพิ่มเติม..." />
          </div>
        </>
      )}
    </>
  );
}
