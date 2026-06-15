'use client';
import { useState, useEffect, useCallback } from 'react';
import { dailyApi, cohortsApi } from '@/lib/api-client';
import {
  Daily, Cohort, Child, DailyReport, MilkStatus, ExcretionType, ExcretionAction,
  ChildExcretion, BehaviorCategory, BehaviorItem, AppUser,
} from '@/types';
import CrudTable from '@/components/admin/CrudTable';
import Modal from '@/components/ui/Modal';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import { Pencil, Trash2, Plus, X, MessageSquare, FileText, User as UserIcon, Utensils, Moon, Toilet } from 'lucide-react';
import { FaceNeutral, FaceSmile, FaceHappy, User } from '@/components/icons';
import ReportModalContent from '@/components/admin/ReportModalContent';

/* ─── Helper: Parse date as local ── */
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  // Extract YYYY-MM-DD from various formats (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, etc.)
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  // Fallback to regular Date parsing
  return new Date(dateStr);
};

/* ─── Helper: Format date as YYYY-MM-DD ── */
const formatDateForInput = (dateStr: string | Date): string => {
  if (!dateStr) return '';
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : '';
};

/* ─── constants ── */
const AL: Record<MilkStatus, string> = { all: 'ทานหมด', some: 'บางส่วน', not_must: 'นิดหน่อย', skip: 'ข้าม' };
const AC: Record<MilkStatus, string> = { all: 'badge-active', some: 'badge-leave', not_must: 'badge-inactive', skip: 'badge-inactive' };
const ET: Record<ExcretionType,   string> = { pee: 'ปัสสาวะ', poo: 'อุจจาระ' };
const EA: Record<ExcretionAction, string> = { diaper: 'ผ้าอ้อม', potty: 'กระโถน' };

const EMPTY_REPORT_FORM = {
  cohort_id: '', daily_id: '', child_id: '',
  nap_from: '', nap_to: '', nap_note: '',
  milk1: 'all' as MilkStatus, milk1_note: '',
  milk2: 'all' as MilkStatus, milk2_note: '',
  food_amount: 'all' as MilkStatus, food_note: '',
  fruit_amount: 'all' as MilkStatus, fruit_note: '',
  note: '',
  created_by: '' as string,
};
const EMPTY_EX = { time: '', type: 'pee' as ExcretionType, action: 'potty' as ExcretionAction };

type BehaviorScore = { item_id: string; score: number | null; note: string };
type ExLocal = ChildExcretion & { _new?: boolean; _del?: boolean };

/* ─── FaceIcon ── */
const FACES = [
  { score: 1, icon: FaceNeutral, label: 'ควรส่งเสริม', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { score: 2, icon: FaceSmile, label: 'ทำได้ดี',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { score: 3, icon: FaceHappy, label: 'ดีเยี่ยม',    color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
];

const DEFAULT_TEACHER_NAME = 'เบียร์';

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
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(Object.entries(AL) as [MilkStatus, string][]).map(([v, l]) => (
          <button key={v} type="button" onClick={() => onAmountChange(v)}
            className={`badge ${AC[v]}`}
            style={{ cursor: 'pointer', padding: '5px 12px', fontSize: 13, border: value === v ? '2px solid currentColor' : '2px solid transparent' }}>
            {l}
          </button>
        ))}
        {/* note toggle - circular icon button matching behavior pattern */}
        <button type="button"
          onClick={() => setShowNote(s => !s)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: showNote ? '#F0EEFF' : '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showNote ? '#6C5CE7' : '#9CA3AF' }}>
          <MessageSquare size={12} />
        </button>
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
          {FACES.slice(0, max).reverse().map(f => {
            const active = val === f.score;
            const IconComponent = f.icon;
            return (
              <button key={f.score} type="button"
                onClick={() => onChange(item.id, active ? null : f.score)}
                title={f.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: active ? `2px solid ${f.color}` : '2px solid transparent',
                  background: active ? f.bg : '#F9FAFB',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', transform: active ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: active ? `0 0 0 3px ${f.border}` : 'none',
                }}>
                <IconComponent size={20} color={active ? f.color : '#9CA3AF'} />
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

export default function DailyPage() {
  const [data, setData] = useState<Daily[]>([]);
  const [allData, setAllData] = useState<Daily[]>([]); // เก็บข้อมูลทั้งหมดไว้เช็ค duplicate
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>(''); // New: cohort filter
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | 'add-report' | null>(null);
  const [selected, setSelected] = useState<Daily | null>(null);
  const [form, setForm] = useState({ cohort_id: '', date: '', activity: '', food: '', fruit: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  // Autocomplete suggestions
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);
  const [fruitSuggestions, setFruitSuggestions] = useState<string[]>([]);
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);

  // Report-related states
  const [reportForm, setReportForm] = useState(EMPTY_REPORT_FORM);
  const [childrenForCohort, setChildrenForCohort] = useState<Child[]>([]);
  const [behaviorsForCohort, setBehaviorsForCohort] = useState<BehaviorCategory[]>([]);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [scores, setScores] = useState<BehaviorScore[]>([]);
  const [excretions, setExcretions] = useState<ExLocal[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [showReportInModal, setShowReportInModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const dailyData = await dailyApi.list(search ? { search } : {}) as Daily[];
      
      // เก็บข้อมูลทั้งหมดไว้สำหรับเช็ค duplicate
      setAllData(dailyData);
      
      // Filter by cohort if selected
      const filteredData = cohortFilter 
        ? dailyData.filter(d => d.cohort_id === cohortFilter)
        : dailyData;
      
      setData(filteredData);
      
      // โหลด report counts แบบ batch (1 API call แทน N calls)
      if (filteredData.length > 0) {
        try {
          const dailyIds = filteredData.map(d => d.id).join(',');
          const res = await fetch(`/api/daily-reports/counts?daily_ids=${dailyIds}`);
          const counts = await res.json();
          setReportCounts(counts);
        } catch {
          // ถ้า error ให้ fallback เป็น 0 ทั้งหมด
          const counts: Record<string, number> = {};
          filteredData.forEach(d => counts[d.id] = 0);
          setReportCounts(counts);
        }
      } else {
        setReportCounts({});
      }
      
      // Collect unique food, fruit, and activity suggestions from existing data
      const foods = new Set<string>();
      const fruits = new Set<string>();
      const activities = new Set<string>();
      dailyData.forEach(d => {
        if (d.food) foods.add(d.food);
        if (d.fruit) fruits.add(d.fruit);
        if (d.activity) activities.add(d.activity);
      });
      setFoodSuggestions(Array.from(foods).sort());
      setFruitSuggestions(Array.from(fruits).sort());
      setActivitySuggestions(Array.from(activities).sort());
    }
    catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, [search, cohortFilter]);

  useEffect(() => {
    cohortsApi.list().then(r => setCohorts(r as Cohort[])).catch(() => {});
    fetch('/api/users?role=teacher').then(r => r.json()).then(j => {
      const ts: AppUser[] = j.data ?? [];
      setTeachers(ts);
    });
  }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  // Check for duplicate cohort_id + date combination
  useEffect(() => {
    if (modal === 'add' && form.cohort_id && form.date) {
      // Check if this combination already exists in ALL data (not filtered)
      const exists = allData.some(d => 
        d.cohort_id === form.cohort_id && 
        formatDateForInput(d.date) === form.date
      );
      setIsDuplicate(exists);
    } else if (modal === 'edit' && form.cohort_id && form.date && selected) {
      // In edit mode, check if the new combination conflicts with other records (excluding current)
      const exists = allData.some(d => 
        d.id !== selected.id &&
        d.cohort_id === form.cohort_id && 
        formatDateForInput(d.date) === form.date
      );
      setIsDuplicate(exists);
    } else {
      setIsDuplicate(false);
    }
  }, [form.cohort_id, form.date, modal, allData, selected]); // ใช้ allData แทน data

  // Load children and behaviors when cohort changes in add/edit modal
  useEffect(() => {
    // For add-report modal, skip this effect (it loads data in openAddReport)
    if (modal === 'add-report') {
      return;
    }
    
    if (!form.cohort_id || modal === 'delete') {
      setChildrenForCohort([]);
      setBehaviorsForCohort([]);
      return;
    }
    
    // Load children
    fetch(`/api/enrollments?cohort_id=${form.cohort_id}`)
      .then(r => r.json())
      .then(j => {
        setChildrenForCohort((j.data ?? []).map((e: { child?: Child }) => e.child).filter(Boolean) as Child[]);
      })
      .catch(() => setChildrenForCohort([]));
    
    // Load behaviors
    fetch(`/api/behavior-categories?cohort_id=${form.cohort_id}`)
      .then(r => r.json())
      .then(j => {
        const cats: BehaviorCategory[] = j.data ?? [];
        setBehaviorsForCohort(cats);
        
        // Set default scores if showing report section
        if (showReportInModal && reportForm.child_id) {
          const defaultScores: BehaviorScore[] = [];
          cats.forEach(cat => {
            (cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.forEach(item => {
              defaultScores.push({ item_id: item.id, score: Math.min(item.max_score, 3), note: '' });
            });
          });
          setScores(defaultScores);
        }
      })
      .catch(() => setBehaviorsForCohort([]));
  }, [form.cohort_id, modal, showReportInModal, reportForm.child_id]);

  const handleSave = async () => {
    // Prevent saving if duplicate detected
    if (isDuplicate) {
      alert('ไม่สามารถบันทึกได้: ห้องเรียนนี้มีบันทึกสำหรับวันที่ดังกล่าวแล้ว');
      return;
    }
    
    setSaving(true);
    try {
      let dailyId: string;
      
      // Save daily record first
      if (modal === 'add') {
        const result = await dailyApi.create(form);
        dailyId = (result as Daily).id;
      } else {
        await dailyApi.update(selected!.id, form);
        dailyId = selected!.id;
      }
      
      // If report section is shown, save reports
      if (showReportInModal) {
        // Support both childrenReports array and single reportForm
        const reportsToSave = childrenReports.length > 0 
          ? childrenReports 
          : reportForm.child_id 
            ? [{
                child_id: reportForm.child_id,
                scores: scores,
                excretions: excretions,
                reportForm: reportForm
              }]
            : [];
        
        // Save all reports
        for (const childReport of reportsToSave) {
          const body = {
            ...childReport.reportForm,
            daily_id: dailyId,
            cohort_id: form.cohort_id,
            nap_from: childReport.reportForm.nap_from || null,
            nap_to: childReport.reportForm.nap_to || null,
            nap_note: childReport.reportForm.nap_note || null,
            milk1_note: childReport.reportForm.milk1_note || null,
            milk2_note: childReport.reportForm.milk2_note || null,
            food_note: childReport.reportForm.food_note || null,
            fruit_note: childReport.reportForm.fruit_note || null,
            note: childReport.reportForm.note || null,
            created_by: childReport.reportForm.created_by || null,
            updated_by: childReport.reportForm.created_by || null,
          };
          
          const res = await fetch('/api/daily-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          
          // Save excretions for this child
          const visibleExcretions = childReport.excretions.filter(ex => !ex._del);
          await Promise.all(
            visibleExcretions.map(ex =>
              fetch('/api/excretions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  daily_id: dailyId,
                  child_id: childReport.child_id,
                  time: ex.time || null,
                  type: ex.type,
                  action: ex.action,
                }),
              })
            )
          );
          
          // Save behavior scores for this child
          if (childReport.scores.length > 0) {
            await Promise.all(
              childReport.scores
                .filter(s => s.score !== null)
                .map(s =>
                  fetch('/api/behavior-scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      daily_id: dailyId,
                      child_id: childReport.child_id,
                      item_id: s.item_id,
                      score: s.score,
                      note: s.note || null,
                    }),
                  })
                )
            );
          }
        }
      }
      
      setModal(null);
      setShowReportInModal(false);
      setChildrenReports([]);
      setActiveChildIndex(0);
      
      // Wait a bit for database to commit, then reload
      await new Promise(resolve => setTimeout(resolve, 100));
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Report handlers
  const openAddReport = async (daily: Daily) => {
    setSelected(daily);
    setChildrenReports([]); // Reset all children reports
    setActiveChildIndex(0);
    const beer = teachers.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
    setReportForm({
      ...EMPTY_REPORT_FORM,
      cohort_id: daily.cohort_id,
      daily_id: daily.id,
      created_by: beer?.id ?? teachers[0]?.id ?? '',
      child_id: '', // Will be set when selecting children
    });
    setScores([]);
    setExcretions([]);
    
    // Open modal first to show loading state
    setModal('add-report');
    
    // Load children for this cohort
    try {
      const res = await fetch(`/api/enrollments?cohort_id=${daily.cohort_id}`);
      const json = await res.json();
      console.log('Enrollments API response:', json);
      const children = (json.data ?? []).map((e: { child?: Child }) => e.child).filter(Boolean) as Child[];
      console.log('Children loaded:', children);
      setChildrenForCohort(children);
    } catch (e) {
      console.error('Error loading children:', e);
      setChildrenForCohort([]);
    }
    
    // Load behaviors for this cohort
    try {
      const res = await fetch(`/api/behavior-categories?cohort_id=${daily.cohort_id}`);
      const json = await res.json();
      console.log('Behaviors API response:', json);
      const cats: BehaviorCategory[] = json.data ?? [];
      setBehaviorsForCohort(cats);
      
      // Set default scores to max (3) for all items
      const defaultScores: BehaviorScore[] = [];
      cats.forEach(cat => {
        (cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.forEach(item => {
          defaultScores.push({ item_id: item.id, score: Math.min(item.max_score, 3), note: '' });
        });
      });
      setScores(defaultScores);
    } catch (e) {
      console.error('Error loading behaviors:', e);
      setBehaviorsForCohort([]);
    }
  };

  // State for multiple children with their own data
  const [childrenReports, setChildrenReports] = useState<{
    child_id: string;
    scores: BehaviorScore[];
    excretions: ExLocal[];
    reportForm: typeof EMPTY_REPORT_FORM;
  }[]>([]);

  const [activeChildIndex, setActiveChildIndex] = useState<number>(0);

  const addChildReport = (childId: string) => {
    // Check if already added
    if (childrenReports.some(cr => cr.child_id === childId)) {
      // If exists, just switch to that child
      const index = childrenReports.findIndex(cr => cr.child_id === childId);
      setActiveChildIndex(index);
      return;
    }

    // Set default scores for this child
    const defaultScores: BehaviorScore[] = [];
    behaviorsForCohort.forEach(cat => {
      (cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.forEach(item => {
        defaultScores.push({ item_id: item.id, score: Math.min(item.max_score, 3), note: '' });
      });
    });

    const beer = teachers.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
    const newReport = {
      child_id: childId,
      scores: defaultScores,
      excretions: [],
      reportForm: {
        ...EMPTY_REPORT_FORM,
        cohort_id: reportForm.cohort_id,
        daily_id: reportForm.daily_id,
        child_id: childId,
        created_by: beer?.id ?? teachers[0]?.id ?? '',
      }
    };

    setChildrenReports(prev => [...prev, newReport]);
    setActiveChildIndex(childrenReports.length); // Switch to new child
  };

  const removeChildReport = (childId: string) => {
    const newReports = childrenReports.filter(cr => cr.child_id !== childId);
    setChildrenReports(newReports);
    if (activeChildIndex >= newReports.length) {
      setActiveChildIndex(Math.max(0, newReports.length - 1));
    }
  };

  const updateChildReport = (childId: string, updates: Partial<typeof childrenReports[0]>) => {
    setChildrenReports(prev =>
      prev.map(cr => cr.child_id === childId ? { ...cr, ...updates } : cr)
    );
  };

  const activeChildReport = childrenReports[activeChildIndex];

  const handleSaveReport = async () => {
    // Support both single child report (reportForm) and multiple children (childrenReports)
    const reportsToSave = childrenReports.length > 0 
      ? childrenReports 
      : reportForm.child_id 
        ? [{
            child_id: reportForm.child_id,
            scores: scores,
            excretions: excretions,
            reportForm: reportForm
          }]
        : [];
    
    if (reportsToSave.length === 0) {
      alert('กรุณาเลือกนักเรียน');
      return;
    }
    
    setSaving(true);
    try {
      // Create reports for all children
      await Promise.all(reportsToSave.map(async (childReport) => {
        const body = {
          ...childReport.reportForm,
          nap_from: childReport.reportForm.nap_from || null,
          nap_to: childReport.reportForm.nap_to || null,
          nap_note: childReport.reportForm.nap_note || null,
          milk1_note: childReport.reportForm.milk1_note || null,
          milk2_note: childReport.reportForm.milk2_note || null,
          food_note: childReport.reportForm.food_note || null,
          fruit_note: childReport.reportForm.fruit_note || null,
          note: childReport.reportForm.note || null,
          created_by: childReport.reportForm.created_by || null,
          updated_by: childReport.reportForm.created_by || null,
        };
        
        const res = await fetch('/api/daily-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        
        // Save excretions for this child
        const visibleExcretions = childReport.excretions.filter(ex => !ex._del);
        await Promise.all(
          visibleExcretions.map(ex =>
            fetch('/api/excretions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                daily_id: childReport.reportForm.daily_id,
                child_id: childReport.child_id,
                time: ex.time || null,
                type: ex.type,
                action: ex.action,
              }),
            })
          )
        );
        
        // Save behavior scores for this child
        if (childReport.scores.length > 0) {
          await Promise.all(
            childReport.scores
              .filter(s => s.score !== null)
              .map(s =>
                fetch('/api/behavior-scores', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    daily_id: childReport.reportForm.daily_id,
                    child_id: childReport.child_id,
                    item_id: s.item_id,
                    score: s.score,
                    note: s.note || null,
                  }),
                })
              )
          );
        }
      }));
      
      setModal(null);
      setChildrenReports([]);
      setActiveChildIndex(0);
      
      // Wait a bit for database to commit, then reload
      await new Promise(resolve => setTimeout(resolve, 100));
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const addEx = () =>
    setExcretions(p => [
      ...p,
      { ...EMPTY_EX, id: `_n_${Date.now()}`, daily_id: '', child_id: '', created_at: '', _new: true },
    ]);
  const delEx = (id: string) => setExcretions(p => p.map(ex => (ex.id === id ? { ...ex, _del: true } : ex)));
  const updEx = (id: string, patch: Partial<ExLocal>) =>
    setExcretions(p => p.map(ex => (ex.id === id ? { ...ex, ...patch } : ex)));

  const setScore = (item_id: string, score: number | null) =>
    setScores(p => {
      const idx = p.findIndex(s => s.item_id === item_id);
      if (idx >= 0) {
        const n = [...p];
        n[idx] = { ...n[idx], score };
        return n;
      }
      return [...p, { item_id, score, note: '' }];
    });

  const setScoreNote = (item_id: string, note: string) =>
    setScores(p => {
      const idx = p.findIndex(s => s.item_id === item_id);
      if (idx >= 0) {
        const n = [...p];
        n[idx] = { ...n[idx], note };
        return n;
      }
      return [...p, { item_id, score: null, note }];
    });

  const visibleEx = excretions.filter(ex => !ex._del);

  // Sort behavior categories: Conduct and Work Habits first
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

  /* ─── section header ─ */
  const Sec = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {label}</p>
  );

  return (
    <>
      <CrudTable<Daily>
        title="บันทึกรายวัน" description="จัดการกิจกรรม อาหาร และข้อมูลประจำวัน"
        columns={[
          { key: 'date', label: 'วันที่', render: (r) => parseLocalDate(r.date).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
          { key: 'cohort', label: 'ห้องเรียน', render: (r) => <span className="badge badge-teacher">{(r.cohort as Cohort)?.name ?? '-'}</span> },
          { key: 'activity', label: 'กิจกรรม' },
          { key: 'food', label: 'อาหาร' },
          { key: 'fruit', label: 'ผลไม้' },
          {
            key: 'reports',
            label: 'Reports',
            render: (r) => {
              const count = reportCounts[r.id] ?? 0;
              return (
                <span className={`badge ${count > 0 ? 'badge-active' : 'badge-inactive'}`}>
                  <FileText size={12} style={{ marginRight: 4 }} />
                  {count}
                </span>
              );
            },
          },
        ]}
        data={data} loading={loading} error={error} onRefresh={load}
        onAdd={() => {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          setForm({ cohort_id: '', date: todayStr, activity: '', food: '', fruit: '', note: '' });
          setShowReportInModal(false);
          const beer = teachers.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
          setReportForm({ ...EMPTY_REPORT_FORM, created_by: beer?.id ?? teachers[0]?.id ?? '' });
          setScores([]);
          setExcretions([]);
          setModal('add');
        }}
        addLabel="เพิ่มบันทึก" 
        searchValue={search} 
        onSearchChange={setSearch} 
        searchPlaceholder="ค้นหา..."
        customFilters={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              className="form-input" 
              value={cohortFilter} 
              onChange={e => setCohortFilter(e.target.value)}
              style={{ width: 200, height: 40 }}
            >
              <option value="">ทุกห้องเรียน</option>
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        }
        actions={(row) => (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => openAddReport(row)}>
              <Plus size={13} /> เพิ่ม Report
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setSelected(row);
              setForm({ 
                cohort_id: row.cohort_id, 
                date: formatDateForInput(row.date), 
                activity: row.activity ?? '', 
                food: row.food ?? '', 
                fruit: row.fruit ?? '', 
                note: row.note ?? '' 
              });
              setShowReportInModal(false);
              setModal('edit');
            }}><Pencil size={13} /> แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(row); setModal('delete'); }}><Trash2 size={13} /> ลบ</button>
          </div>
        )}
      />
      <Modal open={modal === 'add' || modal === 'edit'} title={modal === 'add' ? 'เพิ่มบันทึกรายวัน' : 'แก้ไขบันทึกรายวัน'} onClose={() => { setModal(null); setShowReportInModal(false); setIsDuplicate(false); }} onConfirm={handleSave} confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'} confirmDisabled={isDuplicate || saving}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Daily Info Section */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">ห้องเรียน</label>
                <select className="form-input" value={form.cohort_id} onChange={e => setForm({ ...form, cohort_id: e.target.value })}>
                  <option value="">เลือกห้องเรียน...</option>
                  {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">วันที่</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            
            {/* Duplicate Warning */}
            {isDuplicate && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: 8,
                padding: '12px 16px',
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', margin: 0, marginBottom: 4 }}>
                    มีบันทึกวันนี้แล้ว
                  </p>
                  <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>
                    ห้องเรียนนี้มีบันทึกสำหรับวันที่ดังกล่าวแล้ว กรุณาเลือกวันอื่น หรือแก้ไขบันทึกเดิม
                  </p>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">กิจกรรมวันนี้</label>
              <AutocompleteInput 
                value={form.activity} 
                onChange={v => setForm({ ...form, activity: v })}
                suggestions={activitySuggestions}
                placeholder="พิมพ์เพื่อค้นหาหรือเพิ่มใหม่..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">อาหารกลางวัน</label>
                <AutocompleteInput 
                  value={form.food} 
                  onChange={v => setForm({ ...form, food: v })}
                  suggestions={foodSuggestions}
                  placeholder="พิมพ์เพื่อค้นหาหรือเพิ่มใหม่..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">ผลไม้</label>
                <AutocompleteInput 
                  value={form.fruit} 
                  onChange={v => setForm({ ...form, fruit: v })}
                  suggestions={fruitSuggestions}
                  placeholder="พิมพ์เพื่อค้นหาหรือเพิ่มใหม่..."
                />
              </div>
            </div>
            <div className="form-group"><label className="form-label">หมายเหตุ</label><textarea className="form-input" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ resize: 'vertical' }} /></div>
          </div>

          {/* Toggle Report Section */}
          {form.cohort_id && (
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowReportInModal(!showReportInModal);
                  if (!showReportInModal) {
                    // Reset report form when showing
                    const beer = teachers.find(t => t.display_name?.includes(DEFAULT_TEACHER_NAME));
                    setReportForm({ ...EMPTY_REPORT_FORM, cohort_id: form.cohort_id, created_by: beer?.id ?? teachers[0]?.id ?? '' });
                    setScores([]);
                    setExcretions([]);
                  }
                }}
                style={{ width: '100%' }}
              >
                <Plus size={14} /> {showReportInModal ? 'ซ่อนส่วน Report' : 'เพิ่ม Report สำหรับหลายคน (แยกกันอิสระ)'}
              </button>
            </div>
          )}

          {/* Report Section */}
          {showReportInModal && form.cohort_id && (
            <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '16px' }}>
              {/* Progress indicator */}
              {childrenReports.length > 0 && (
                <div style={{ background: '#F0EEFF', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6C5CE7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color="#6C5CE7" /> ความคืบหน้า
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                      กำลังบันทึก: <strong>{activeChildIndex + 1}</strong> / {childrenReports.length} คน
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {childrenReports.map((cr, index) => {
                      const child = childrenForCohort.find(c => c.id === cr.child_id);
                      const displayName = child?.nickname_en || child?.nickname_th || child?.name_en || child?.name_th || '?';
                      const isActive = activeChildIndex === index;
                      const isPast = index < activeChildIndex;
                      return (
                        <div
                          key={cr.child_id}
                          title={displayName}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isActive ? '#6C5CE7' : isPast ? '#10B981' : '#E5E7EB',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all .2s',
                            border: isActive ? '2px solid #4F46E5' : '2px solid transparent'
                          }}
                          onClick={() => setActiveChildIndex(index)}
                        >
                          {isPast ? '✓' : index + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Selection */}
              <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                <Sec icon={<User size={14} color="#9CA3AF" />} label="เลือกนักเรียน" color="#9CA3AF" />
                
                {childrenReports.length === 0 ? (
                  // Initial selection - show all students
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {childrenForCohort.map(c => (
                      <button 
                        key={c.id} 
                        type="button" 
                        onClick={() => addChildReport(c.id)}
                        style={{ 
                          padding: '8px 16px', 
                          borderRadius: 8, 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontSize: 14, 
                          fontFamily: 'Sarabun,sans-serif', 
                          background: '#FFFFFF', 
                          color: '#1A1A2E', 
                          fontWeight: 500, 
                          boxShadow: '0 0 0 1px #E5E7EB', 
                          transition: 'all .15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#6C5CE7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        {c.nickname_en || c.nickname_th || c.name_en || c.name_th || c.id}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Show current student and add more button
                  <div>
                    <div style={{ background: 'white', borderRadius: 8, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                          {(() => {
                            const child = childrenForCohort.find(c => c.id === activeChildReport?.child_id);
                            return child?.nickname_en || child?.nickname_th || child?.name_en || child?.name_th || 'ไม่ระบุชื่อ';
                          })()}
                        </p>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                          นักเรียนคนที่ {activeChildIndex + 1}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const confirm = window.confirm('ต้องการลบข้อมูลของนักเรียนคนนี้?');
                          if (confirm) removeChildReport(activeChildReport!.child_id);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#FEE2E2',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: 'Sarabun,sans-serif'
                        }}
                      >
                        <X size={14} style={{ marginRight: 4, display: 'inline' }} />
                        ลบ
                      </button>
                    </div>
                    
                    {/* Add more student */}
                    <details style={{ fontSize: 13 }}>
                      <summary style={{ cursor: 'pointer', color: '#6C5CE7', fontWeight: 600, padding: '8px 0' }}>
                        <Plus size={14} style={{ marginRight: 4, display: 'inline' }} />
                        เพิ่มนักเรียนอีกคน
                      </summary>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 20 }}>
                        {childrenForCohort
                          .filter(c => !childrenReports.some(cr => cr.child_id === c.id))
                          .map(c => (
                            <button 
                              key={c.id} 
                              type="button" 
                              onClick={() => addChildReport(c.id)}
                              style={{ 
                                padding: '6px 12px', 
                                borderRadius: 6, 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: 13, 
                                fontFamily: 'Sarabun,sans-serif', 
                                background: '#F3F4F6', 
                                color: '#6B7280', 
                                fontWeight: 400
                              }}
                            >
                              {c.nickname_en || c.nickname_th || c.name_en || c.name_th || c.id}
                            </button>
                          ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {activeChildReport && (
                <>
                  {/* Behaviors */}
                  {sortedBehaviors.map(cat => (
                    <div key={cat.id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                      <Sec icon={<FileText size={14} color="#6C5CE7" />} label={`${cat.name_th}  ${cat.name_en}`} color="#6C5CE7" />
                      {(cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.map(item => (
                        <ScoreInput key={item.id} item={item}
                          score={activeChildReport.scores.find(s => s.item_id === item.id)}
                          onChange={(item_id, score) => {
                            const newScores = [...activeChildReport.scores.filter(s => s.item_id !== item_id)];
                            if (score !== null) {
                              newScores.push({ 
                                item_id, 
                                score, 
                                note: activeChildReport.scores.find(s => s.item_id === item_id)?.note ?? '' 
                              });
                            }
                            updateChildReport(activeChildReport.child_id, { scores: newScores });
                          }}
                          onNoteChange={(item_id, note) => {
                            const newScores = activeChildReport.scores.map(s => 
                              s.item_id === item_id ? { ...s, note } : s
                            );
                            if (!newScores.find(s => s.item_id === item_id)) {
                              newScores.push({ item_id, score: null, note });
                            }
                            updateChildReport(activeChildReport.child_id, { scores: newScores });
                          }} />
                      ))}
                    </div>
                  ))}

                  {/* Nap Time */}
                  <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <Sec icon={<Moon size={14} color="#9CA3AF" />} label="การนอน" color="#9CA3AF" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">เริ่มนอน</label>
                        <input className="form-input" type="time" 
                          value={activeChildReport.reportForm.nap_from} 
                          onChange={e => updateChildReport(activeChildReport.child_id, { 
                            reportForm: { ...activeChildReport.reportForm, nap_from: e.target.value } 
                          })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ตื่นนอน</label>
                        <input className="form-input" type="time" 
                          value={activeChildReport.reportForm.nap_to} 
                          onChange={e => updateChildReport(activeChildReport.child_id, { 
                            reportForm: { ...activeChildReport.reportForm, nap_to: e.target.value } 
                          })} />
                      </div>
                    </div>
                    {/* Nap Note with Toggle */}
                    <div className="form-group" style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="form-label" style={{ margin: 0 }}>หมายเหตุ (สำหรับเด็กไม่นอน)</label>
                        <button type="button"
                          onClick={() => {
                            const napNoteInput = document.getElementById(`nap-note-input-${activeChildReport.child_id}`);
                            if (napNoteInput) {
                              (napNoteInput as HTMLElement).style.display = 
                                (napNoteInput as HTMLElement).style.display === 'none' ? 'block' : 'none';
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: activeChildReport.reportForm.nap_note ? '#F0EEFF' : 'transparent', border: 'none', borderRadius: 99, padding: '3px 8px', cursor: 'pointer', color: activeChildReport.reportForm.nap_note ? '#6C5CE7' : '#9CA3AF', fontSize: 12, fontFamily: 'Sarabun, sans-serif' }}>
                          <MessageSquare size={12} /> {activeChildReport.reportForm.nap_note ? 'ซ่อน' : 'หมายเหตุ'}
                        </button>
                      </div>
                      <input 
                        id={`nap-note-input-${activeChildReport.child_id}`}
                        className="form-input" 
                        style={{ display: activeChildReport.reportForm.nap_note ? 'block' : 'none' }}
                        placeholder="เช่น ไม่นอน, เล่นตลอด, นอนดึก..."
                        value={activeChildReport.reportForm.nap_note}
                        onChange={e => updateChildReport(activeChildReport.child_id, { 
                          reportForm: { ...activeChildReport.reportForm, nap_note: e.target.value } 
                        })} />
                    </div>
                  </div>

                  {/* Excretions */}
                  <div style={{ background: '#F0EEFF', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Sec icon={<Toilet size={14} color="#6C5CE7" />} label="การขับถ่าย" color="#6C5CE7" />
                      <button type="button" className="btn btn-sm" 
                        style={{ background: '#6C5CE7', color: 'white', fontSize: 12 }} 
                        onClick={() => {
                          const newEx = { 
                            ...EMPTY_EX, 
                            id: `_n_${Date.now()}`, 
                            daily_id: '', 
                            child_id: '', 
                            created_at: '', 
                            _new: true 
                          };
                          updateChildReport(activeChildReport.child_id, { 
                            excretions: [...activeChildReport.excretions, newEx] 
                          });
                        }}>
                        <Plus size={12} /> เพิ่ม
                      </button>
                    </div>
                    {activeChildReport.excretions.filter(ex => !ex._del).length === 0 && (
                      <p style={{ color: '#9CA3AF', fontSize: 13 }}>ยังไม่มีบันทึก</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeChildReport.excretions.filter(ex => !ex._del).map(ex => (
                        <div key={ex.id} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input type="time" className="form-input" value={ex.time ?? ''} 
                            onChange={evt => {
                              const newExs = activeChildReport.excretions.map(e => 
                                e.id === ex.id ? { ...e, time: evt.target.value || null } : e
                              );
                              updateChildReport(activeChildReport.child_id, { excretions: newExs });
                            }} 
                            style={{ width: 100, padding: '5px 8px', fontSize: 13 }} />
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['pee', 'poo'] as ExcretionType[]).map(t => (
                              <button key={t} type="button" 
                                onClick={() => {
                                  const newExs = activeChildReport.excretions.map(e => 
                                    e.id === ex.id ? { ...e, type: t } : e
                                  );
                                  updateChildReport(activeChildReport.child_id, { excretions: newExs });
                                }}
                                style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.type === t ? (t === 'pee' ? '#EBF4FA' : '#FEF6E6') : '#F3F4F6', color: ex.type === t ? (t === 'pee' ? '#4A90B8' : '#F5A623') : '#9CA3AF', fontWeight: ex.type === t ? 600 : 400 }}>
                                {ET[t]}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['diaper', 'potty'] as ExcretionAction[]).map(a => (
                              <button key={a} type="button" 
                                onClick={() => {
                                  const newExs = activeChildReport.excretions.map(e => 
                                    e.id === ex.id ? { ...e, action: a } : e
                                  );
                                  updateChildReport(activeChildReport.child_id, { excretions: newExs });
                                }}
                                style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, background: ex.action === a ? '#F0EEFF' : '#F3F4F6', color: ex.action === a ? '#6C5CE7' : '#9CA3AF', fontWeight: ex.action === a ? 600 : 400 }}>
                                {EA[a]}
                              </button>
                            ))}
                          </div>
                          <button type="button" 
                            onClick={() => {
                              const newExs = activeChildReport.excretions.map(e => 
                                e.id === ex.id ? { ...e, _del: true } : e
                              );
                              updateChildReport(activeChildReport.child_id, { excretions: newExs });
                            }} 
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Food & Fruit */}
                  <div style={{ background: '#EBF7F0', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <Sec icon={<Utensils size={14} color="#4CAF76" />} label="ปริมาณที่รับประทาน" color="#4CAF76" />
                    <AmountSelect
                      label={form.food ? form.food : "ปริมาณอาหาร"}
                      value={activeChildReport.reportForm.food_amount}
                      noteValue={activeChildReport.reportForm.food_note}
                      onAmountChange={v => updateChildReport(activeChildReport.child_id, { 
                        reportForm: { ...activeChildReport.reportForm, food_amount: v } 
                      })}
                      onNoteChange={v => updateChildReport(activeChildReport.child_id, { 
                        reportForm: { ...activeChildReport.reportForm, food_note: v } 
                      })}
                    />
                    <div style={{ marginTop: 10 }}>
                      <AmountSelect
                        label={form.fruit ? form.fruit : "ปริมาณผลไม้"}
                        value={activeChildReport.reportForm.fruit_amount}
                        noteValue={activeChildReport.reportForm.fruit_note}
                        onAmountChange={v => updateChildReport(activeChildReport.child_id, { 
                          reportForm: { ...activeChildReport.reportForm, fruit_amount: v } 
                        })}
                        onNoteChange={v => updateChildReport(activeChildReport.child_id, { 
                          reportForm: { ...activeChildReport.reportForm, fruit_note: v } 
                        })}
                      />
                    </div>
                  </div>

                  {/* Milk */}
                  <div style={{ background: '#FEF0EB', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                    <Sec icon={<Utensils size={14} color="#E8754A" />} label="นม" color="#E8754A" />
                    <AmountSelect label="นม มื้อ 1" 
                      value={activeChildReport.reportForm.milk1} 
                      noteValue={activeChildReport.reportForm.milk1_note}
                      onAmountChange={v => updateChildReport(activeChildReport.child_id, { 
                        reportForm: { ...activeChildReport.reportForm, milk1: v } 
                      })}
                      onNoteChange={v => updateChildReport(activeChildReport.child_id, { 
                        reportForm: { ...activeChildReport.reportForm, milk1_note: v } 
                      })} />
                    <div style={{ marginTop: 10 }}>
                      <AmountSelect label="นม มื้อ 2" 
                        value={activeChildReport.reportForm.milk2} 
                        noteValue={activeChildReport.reportForm.milk2_note}
                        onAmountChange={v => updateChildReport(activeChildReport.child_id, { 
                          reportForm: { ...activeChildReport.reportForm, milk2: v } 
                        })}
                        onNoteChange={v => updateChildReport(activeChildReport.child_id, { 
                          reportForm: { ...activeChildReport.reportForm, milk2_note: v } 
                        })} />
                    </div>
                  </div>

                  {/* Teacher selector */}
                  <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserIcon size={14} color="#9CA3AF" /> ครูผู้บันทึก
                    </p>
                    {teachers.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                        ยังไม่มีครูในระบบ
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {teachers.map(t => {
                          const active = activeChildReport.reportForm.created_by === t.id;
                          return (
                            <button key={t.id} type="button"
                              onClick={() => updateChildReport(activeChildReport.child_id, { 
                                reportForm: { ...activeChildReport.reportForm, created_by: t.id } 
                              })}
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
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div className="form-group">
                    <label className="form-label">ข้อความถึงผู้ปกครอง</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={activeChildReport.reportForm.note}
                      onChange={e => updateChildReport(activeChildReport.child_id, { 
                        reportForm: { ...activeChildReport.reportForm, note: e.target.value } 
                      })}
                      placeholder="เพิ่มเติม..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
      <Modal open={modal === 'delete'} title="ยืนยันการลบ" onClose={() => setModal(null)} onConfirm={async () => { setSaving(true); try { await dailyApi.delete(selected!.id); setModal(null); load(); } finally { setSaving(false); } }} confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ลบบันทึกวันที่ <strong>{selected?.date}</strong>?</p>
      </Modal>

      {/* Add Report Modal */}
      <Modal
        open={modal === 'add-report'}
        title={`เพิ่มรายงานรายวัน — ${selected ? new Date(selected.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`}
        onClose={() => setModal(null)}
        onConfirm={handleSaveReport}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
        size="large"
      >
        <ReportModalContent
          selectedDaily={selected}
          childrenForCohort={childrenForCohort}
          behaviorsForCohort={behaviorsForCohort}
          teachers={teachers}
          reportForm={reportForm}
          scores={scores}
          excretions={excretions}
          onReportFormChange={setReportForm}
          onScoreChange={setScore}
          onScoreNoteChange={setScoreNote}
          onExcretionAdd={addEx}
          onExcretionUpdate={updEx}
          onExcretionDelete={delEx}
          onChildSelect={(child_id) => {
            // Set default scores when child is selected
            if (behaviorsForCohort.length > 0) {
              const defaultScores: BehaviorScore[] = [];
              behaviorsForCohort.forEach(cat => {
                (cat as BehaviorCategory & { items?: BehaviorItem[] }).items?.forEach(item => {
                  defaultScores.push({ item_id: item.id, score: Math.min(item.max_score, 3), note: '' });
                });
              });
              setScores(defaultScores);
            }
          }}
        />
      </Modal>
    </>
  );
}
