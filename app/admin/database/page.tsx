'use client';
import { useState, useRef } from 'react';
import {
  Download, Upload, CheckCircle, AlertCircle, Loader2,
  Database, RefreshCw, FileJson, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';

interface ConflictItem { id: string; preview: string }
interface TableStat { inserted: number; skipped: number; overwritten: number; conflicts: ConflictItem[] }
type StatsMap = Record<string, TableStat>;

const TABLE_LABELS: Record<string, string> = {
  app_user:             '👤 ผู้ใช้งาน',
  child:                '👧 นักเรียน',
  cohort:               '🏫 ห้องเรียน',
  parent_child:         '👨‍👩‍👧 ผู้ปกครอง-นักเรียน',
  teacher_permission:   '🔑 สิทธิ์ครู',
  enrollment:           '📋 การลงทะเบียน',
  daily:                '📅 บันทึกรายวัน',
  attendance:           '✅ การเข้าเรียน',
  daily_report:         '📝 รายงานรายวัน',
  behavior_category:    '🧠 หมวดหมู่พฤติกรรม',
  behavior_item:        '📌 รายการพฤติกรรม',
  child_behavior_score: '⭐ คะแนนพฤติกรรม',
  child_excretion:      '🚽 การขับถ่าย',
  holidays:             '🏖️ วันหยุด',
};

export default function DatabasePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  // export
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [selectedExportTables, setSelectedExportTables] = useState<Set<string>>(new Set(Object.keys(TABLE_LABELS)));

  // import flow
  const [file, setFile]                   = useState<File | null>(null);
  const [preview, setPreview]             = useState<{ exported_at: string; rowCounts: Record<string, number> } | null>(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [dryStats, setDryStats]           = useState<StatsMap | null>(null);       // result of dry_run
  const [overwriteTables, setOverwriteTables] = useState<Set<string>>(new Set());  // user's choice
  const [importing, setImporting]         = useState(false);
  const [importResult, setImportResult]   = useState<{ ok: boolean; stats?: StatsMap; error?: string } | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  
  // batch import
  const [batchImporting, setBatchImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; table: string } | null>(null);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = async () => {
    if (selectedExportTables.size === 0) {
      alert('กรุณาเลือกตารางที่ต้องการ export อย่างน้อย 1 ตาราง');
      return;
    }
    
    setExporting(true); setExportDone(false);
    try {
      const tables = Array.from(selectedExportTables).join(',');
      
      // Add timeout to fetch request (60 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const res  = await fetch(`/api/db-export?format=${exportFormat}&tables=${tables}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is OK
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let errorMessage = `Export failed with status ${res.status}`;
        
        if (contentType.includes('application/json')) {
          try {
            const errorJson = await res.json();
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = await res.text();
          }
        } else {
          errorMessage = await res.text();
        }
        
        throw new Error(errorMessage.substring(0, 200));
      }
      
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const cd   = res.headers.get('content-disposition') ?? '';
      a.download = cd.match(/filename="([^"]+)"/)?.[1] ?? `backup.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e) {
      console.error('Export error:', e);
      if (e instanceof Error && e.name === 'AbortError') {
        alert('การ export ใช้เวลานานเกินไป (timeout 60 วินาที)\nลองเลือกตารางน้อยลง หรือ export ทีละส่วน');
      } else {
        alert(e instanceof Error ? e.message : 'export ไม่สำเร็จ');
      }
    }
    finally { setExporting(false); }
  };

  const toggleExportTable = (table: string) => {
    setSelectedExportTables(prev => {
      const s = new Set(prev);
      s.has(table) ? s.delete(table) : s.add(table);
      return s;
    });
  };

  const selectAllExportTables = () => setSelectedExportTables(new Set(Object.keys(TABLE_LABELS)));
  const deselectAllExportTables = () => setSelectedExportTables(new Set());

  // ── File pick ───────────────────────────────────────────────
  const handleFilePick = (f: File) => {
    // Only accept JSON for import
    if (!f.name.endsWith('.json')) {
      alert('รองรับเฉพาะไฟล์ JSON สำหรับการ import\nCSV สามารถใช้สำหรับ export เท่านั้น');
      return;
    }
    
    setFile(f); setDryStats(null); setImportResult(null);
    setOverwriteTables(new Set()); setPreview(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (json?.tables) {
          const rowCounts: Record<string, number> = {};
          for (const [t, rows] of Object.entries(json.tables))
            rowCounts[t] = Array.isArray(rows) ? rows.length : 0;
          setPreview({ exported_at: json.exported_at ?? '', rowCounts });
        }
      } catch { /* ignore */ }
    };
    reader.readAsText(f);
  };

  // ── Step 1: Dry run — วิเคราะห์ conflict ──────────────────
  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true); setDryStats(null); setImportResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Add timeout to fetch request (60 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const res  = await fetch('/api/db-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...json, dry_run: true }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) {
        console.error('Analyze API error:', data);
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'วิเคราะห์ไม่สำเร็จ';
        throw new Error(errorMsg);
      }
      setDryStats(data.data.stats as StatsMap);
    } catch (e) {
      console.error('Analyze error:', e);
      if (e instanceof Error && e.name === 'AbortError') {
        alert('การวิเคราะห์ใช้เวลานานเกินไป (timeout 60 วินาที)\nไฟล์อาจมีข้อมูลมากเกินไป');
      } else {
        const errorMsg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'วิเคราะห์ไม่สำเร็จ';
        alert(errorMsg);
      }
    }
    finally { setAnalyzing(false); }
  };

  // ── Step 2: Import จริง ─────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setImportResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Add timeout to fetch request (60 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const res  = await fetch('/api/db-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...json,
          dry_run: false,
          overwrite_tables: [...overwriteTables],
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) {
        console.error('Import API error:', data);
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'เกิดข้อผิดพลาด';
        throw new Error(errorMsg);
      }
      setImportResult({ ok: true, stats: data.data.stats });
      setDryStats(null);
    } catch (e) {
      console.error('Import error:', e);
      let errorMsg: string;
      if (e instanceof Error && e.name === 'AbortError') {
        errorMsg = 'การ import ใช้เวลานานเกินไป (timeout 60 วินาที)\nไฟล์อาจมีข้อมูลมากเกินไป';
      } else {
        errorMsg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'เกิดข้อผิดพลาด';
      }
      setImportResult({ ok: false, error: errorMsg }); 
    }
    finally { setImporting(false); }
  };

  // ── Step 3: Batch Import (สำหรับไฟล์ขนาดใหญ่) ───────────────
  const handleBatchImport = async () => {
    if (!file) return;
    setBatchImporting(true);
    setBatchProgress(null);
    setImportResult(null);
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const tables = Object.keys(json.tables || {}).filter(t => (json.tables[t] as any[])?.length > 0);
      
      if (tables.length === 0) {
        throw new Error('ไม่พบตารางที่มีข้อมูล');
      }

      const allStats: StatsMap = {};
      const hasOverwriteConfig = overwriteTables.size > 0;
      
      // Import table by table
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = json.tables[table];
        
        setBatchProgress({ current: i + 1, total: tables.length, table });
        
        try {
          const res = await fetch('/api/db-import-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table,
              rows,
              // ถ้าไม่ผ่าน analyze จะไม่เขียนทับ (skip conflicts)
              overwrite: hasOverwriteConfig ? overwriteTables.has(table) : false,
            }),
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            console.error(`Batch import error for ${table}:`, data);
            allStats[table] = {
              inserted: 0,
              skipped: 0,
              overwritten: 0,
              conflicts: [],
              errors: [data.error || 'Import failed'],
            } as any;
            continue;
          }
          
          allStats[table] = data.data.stats;
        } catch (err) {
          console.error(`Batch import error for ${table}:`, err);
          allStats[table] = {
            inserted: 0,
            skipped: 0,
            overwritten: 0,
            conflicts: [],
            errors: [err instanceof Error ? err.message : 'Import failed'],
          } as any;
        }
      }
      
      setImportResult({ ok: true, stats: allStats });
      setDryStats(null);
      setBatchProgress(null);
    } catch (e) {
      console.error('Batch import error:', e);
      const errorMsg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'เกิดข้อผิดพลาด';
      setImportResult({ ok: false, error: errorMsg });
      setBatchProgress(null);
    }
    finally { setBatchImporting(false); }
  };

  const totalConflicts = dryStats
    ? Object.values(dryStats).reduce((a, b) => a + b.conflicts.length, 0) : 0;
  const toggleOverwrite = (t: string) => setOverwriteTables(prev => {
    const s = new Set(prev);
    s.has(t) ? s.delete(t) : s.add(t);
    return s;
  });
  const totalInserted = importResult?.stats ? Object.values(importResult.stats).reduce((a,b)=>a+b.inserted,0) : 0;
  const totalOverwritten = importResult?.stats ? Object.values(importResult.stats).reduce((a,b)=>a+b.overwritten,0) : 0;

  const SBox = ({ style = {} }: { style?: React.CSSProperties }) => (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 16, overflow: 'hidden', ...style }} />
  );
  void SBox;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={20} style={{ color: '#6C5CE7' }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Prompt, sans-serif' }}>นำเข้า / ส่งออกข้อมูล</h1>
            <p style={{ color: '#9CA3AF', fontSize: 12 }}>Backup และ Restore ฐานข้อมูลทั้งหมด</p>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>

        {/* ── Export ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: '#F0EEFF', padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={18} style={{ color: '#6C5CE7' }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#4C1D95' }}>ส่งออกข้อมูล (Export)</h2>
              <p style={{ fontSize: 12, color: '#7C3AED', marginTop: 2 }}>เลือกตารางและรูปแบบไฟล์ที่ต้องการ</p>
            </div>
          </div>
          <div style={{ padding: 18 }}>
            {/* Format selector */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>รูปแบบไฟล์</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setExportFormat('json')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: exportFormat === 'json' ? '2px solid #6C5CE7' : '1px solid #E5E7EB',
                    background: exportFormat === 'json' ? '#F0EEFF' : 'white',
                    color: exportFormat === 'json' ? '#6C5CE7' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: exportFormat === 'json' ? 700 : 400,
                    fontSize: 14
                  }}
                >
                  📄 JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: exportFormat === 'csv' ? '2px solid #6C5CE7' : '1px solid #E5E7EB',
                    background: exportFormat === 'csv' ? '#F0EEFF' : 'white',
                    color: exportFormat === 'csv' ? '#6C5CE7' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: exportFormat === 'csv' ? 700 : 400,
                    fontSize: 14
                  }}
                >
                  📊 CSV
                </button>
              </div>
            </div>

            {/* Table selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>เลือกตาราง</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={selectAllExportTables} style={{ fontSize: 11 }}>
                    เลือกทั้งหมด
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={deselectAllExportTables} style={{ fontSize: 11 }}>
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 8, background: '#F9FAFB', borderRadius: 8 }}>
                {Object.entries(TABLE_LABELS).map(([t, l]) => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, background: selectedExportTables.has(t) ? '#E0E7FF' : 'white', border: '1px solid', borderColor: selectedExportTables.has(t) ? '#6C5CE7' : '#E5E7EB' }}>
                    <input
                      type="checkbox"
                      checked={selectedExportTables.has(t)}
                      onChange={() => toggleExportTable(t)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: selectedExportTables.has(t) ? '#4C1D95' : '#6B7280', fontWeight: selectedExportTables.has(t) ? 600 : 400 }}>{l}</span>
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                เลือกแล้ว: {selectedExportTables.size} / {Object.keys(TABLE_LABELS).length} ตาราง
              </p>
            </div>

            <button className="btn btn-primary" onClick={handleExport} disabled={exporting || selectedExportTables.size === 0}
              style={{ width: '100%', justifyContent: 'center', background: '#6C5CE7' }}>
              {exporting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลัง export...</>
                : exportDone ? <><CheckCircle size={15} /> ดาวน์โหลดแล้ว!</>
                : <><Download size={15} /> Export {exportFormat.toUpperCase()} ({selectedExportTables.size} ตาราง)</>}
            </button>
          </div>
        </div>

        {/* ── Import ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: '#EBF7F0', padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload size={18} style={{ color: '#059669' }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#064E3B' }}>นำเข้าข้อมูล (Import)</h2>
              <p style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>อัปโหลดไฟล์ JSON แล้วเลือกว่าจะเขียนทับข้อมูล conflict หรือไม่ (CSV ไม่รองรับ)</p>
            </div>
          </div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Drop zone */}
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFilePick(f); }}
              style={{ border: `2px dashed ${file ? '#059669' : '#D1D5DB'}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#FAFAFA' }}>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFilePick(e.target.files[0])} />
              {file ? (
                <><FileJson size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, color: '#065F46', fontSize: 14 }}>{file.name}</p>
                  <p style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{(file.size/1024).toFixed(1)} KB · คลิกเพื่อเปลี่ยนไฟล์</p></>
              ) : (
                <><Upload size={28} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
                  <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>คลิกหรือลากไฟล์ JSON มาวาง</p>
                  <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>เฉพาะไฟล์จากการ Export เท่านั้น</p></>
              )}
            </div>

            {/* File preview */}
            {preview && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                  📦 ข้อมูลในไฟล์
                  {preview.exported_at && <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>({new Date(preview.exported_at).toLocaleString('th-TH')})</span>}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {Object.entries(preview.rowCounts).filter(([,n]) => n > 0).map(([t, n]) => (
                    <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                      <span>{TABLE_LABELS[t] ?? t}</span>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Analyze or Batch Import buttons */}
            {file && !dryStats && !importResult && !batchImporting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}
                  style={{ width: '100%', justifyContent: 'center', background: '#4A90B8' }}>
                  {analyzing
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลังวิเคราะห์...</>
                    : <><AlertTriangle size={15} /> วิเคราะห์ Conflict ก่อน import</>}
                </button>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                  <span style={{ padding: '0 12px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>หรือ</span>
                  <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                </div>
                
                <button className="btn btn-primary" onClick={handleBatchImport} disabled={analyzing}
                  style={{ width: '100%', justifyContent: 'center', background: '#6C5CE7' }}>
                  <Database size={15} /> Batch Import โดยตรง (ไฟล์ใหญ่)
                </button>
                <div style={{ background: '#F0EEFF', borderRadius: 8, padding: 10, border: '1px solid #E9D5FF' }}>
                  <p style={{ fontSize: 11, color: '#7C3AED', margin: 0, lineHeight: 1.4 }}>
                    💡 <strong>Batch Import:</strong> ใช้สำหรับไฟล์ใหญ่ที่อาจ timeout<br/>
                    • ข้ามขั้นตอนวิเคราะห์<br/>
                    • Import ทีละ table พร้อม progress bar<br/>
                    • ข้อมูลซ้ำจะถูกข้าม (ไม่เขียนทับ)
                  </p>
                </div>
              </div>
            )}

            {/* ── Conflict report (dry_run result) ── */}
            {dryStats && (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                {/* summary header */}
                <div style={{ background: totalConflicts > 0 ? '#FFFBEB' : '#ECFDF5', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {totalConflicts > 0
                    ? <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
                    : <CheckCircle size={18} style={{ color: '#059669', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: totalConflicts > 0 ? '#92400E' : '#064E3B' }}>
                      {totalConflicts > 0 ? `พบ ${totalConflicts} รายการที่ซ้ำกัน` : 'ไม่พบ conflict พร้อม import เลย'}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      เลือก table ที่ต้องการเขียนทับ จากนั้นกด Import
                    </p>
                  </div>
                </div>

                {/* per-table conflict list */}
                <div style={{ background: 'white' }}>
                  {Object.entries(dryStats).filter(([,s]) => s.inserted > 0 || s.conflicts.length > 0).map(([table, s]) => {
                    const hasConflict = s.conflicts.length > 0;
                    const willOverwrite = overwriteTables.has(table);
                    const isExpanded = expandedTable === table;
                    return (
                      <div key={table} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{TABLE_LABELS[table] ?? table}</span>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                              {s.inserted > 0 && <span style={{ fontSize: 11, color: '#059669' }}>+{s.inserted} ใหม่</span>}
                              {hasConflict && <span style={{ fontSize: 11, color: '#D97706' }}>⚠ {s.conflicts.length} ซ้ำ</span>}
                            </div>
                          </div>

                          {/* overwrite toggle */}
                          {hasConflict && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                              <div
                                onClick={() => toggleOverwrite(table)}
                                style={{
                                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background .2s',
                                  background: willOverwrite ? '#E8754A' : '#E2E8F0',
                                  position: 'relative', flexShrink: 0,
                                }}>
                                <div style={{
                                  position: 'absolute', top: 3, left: willOverwrite ? 21 : 3,
                                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                                  transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }} />
                              </div>
                              <span style={{ fontSize: 12, color: willOverwrite ? '#E8754A' : '#94A3B8', fontWeight: willOverwrite ? 700 : 400 }}>
                                {willOverwrite ? 'เขียนทับ' : 'ข้าม'}
                              </span>
                            </label>
                          )}

                          {/* expand conflict list */}
                          {hasConflict && (
                            <button onClick={() => setExpandedTable(isExpanded ? null : table)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 2 }}>
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          )}
                        </div>

                        {/* conflict detail */}
                        {isExpanded && hasConflict && (
                          <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {s.conflicts.map(c => (
                              <span key={c.id} style={{ fontSize: 11, background: '#FEF9C3', color: '#92400E', padding: '2px 8px', borderRadius: 6, border: '1px solid #FDE68A' }}>
                                {c.preview}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Select all / none */}
                {totalConflicts > 0 && (
                  <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOverwriteTables(new Set(Object.entries(dryStats).filter(([,s]) => s.conflicts.length > 0).map(([t]) => t)))}>
                      เขียนทับทั้งหมด
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOverwriteTables(new Set())}>
                      ข้ามทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Import buttons */}
            {dryStats && !importResult && !batchImporting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing}
                  style={{ width: '100%', justifyContent: 'center', background: '#059669' }}>
                  {importing
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลัง import...</>
                    : <><Upload size={15} /> ยืนยัน Import {overwriteTables.size > 0 ? `(เขียนทับ ${overwriteTables.size} table)` : ''}</>}
                </button>
                <button className="btn btn-ghost" onClick={handleBatchImport} disabled={importing}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                  <Database size={13} /> Batch Import (สำหรับไฟล์ใหญ่)
                </button>
                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
                  ใช้ Batch Import ถ้าไฟล์ใหญ่เกิน 60 วินาที
                </p>
              </div>
            )}

            {/* Batch Progress */}
            {batchProgress && (
              <div style={{ background: '#F0EEFF', borderRadius: 12, padding: 16, border: '1px solid #E9D5FF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Loader2 size={16} style={{ color: '#6C5CE7', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#4C1D95' }}>
                    กำลัง import ตารางที่ {batchProgress.current} / {batchProgress.total}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: '#7C3AED', marginBottom: 10 }}>
                  {TABLE_LABELS[batchProgress.table] ?? batchProgress.table}
                </p>
                <div style={{ height: 6, background: '#E9D5FF', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: '#6C5CE7', 
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${importResult.ok ? '#D1FAE5' : '#FECACA'}` }}>
                <div style={{ padding: '12px 16px', background: importResult.ok ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {importResult.ok
                    ? <CheckCircle size={18} style={{ color: '#059669' }} />
                    : <AlertCircle size={18} style={{ color: '#DC2626' }} />}
                  <p style={{ fontWeight: 700, fontSize: 14, color: importResult.ok ? '#064E3B' : '#991B1B' }}>
                    {importResult.ok ? `นำเข้าสำเร็จ — ใหม่ ${totalInserted} | เขียนทับ ${totalOverwritten}` : 'เกิดข้อผิดพลาด'}
                  </p>
                </div>
                {importResult.ok && importResult.stats && (
                  <div style={{ padding: '12px 16px', background: 'white', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(importResult.stats).filter(([,s]) => s.inserted > 0 || s.overwritten > 0 || s.skipped > 0).map(([t, s]: [string, any]) => (
                      <div key={t}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #F1F5F9' }}>
                          <span style={{ color: '#6B7280' }}>{TABLE_LABELS[t] ?? t}</span>
                          <span>
                            {s.inserted > 0 && <span style={{ color: '#059669', fontWeight: 600 }}>+{s.inserted} ใหม่ </span>}
                            {s.overwritten > 0 && <span style={{ color: '#E8754A', fontWeight: 600 }}>↻{s.overwritten} เขียนทับ </span>}
                            {s.skipped > 0 && <span style={{ color: '#94A3B8' }}>/{s.skipped} ข้าม</span>}
                          </span>
                        </div>
                        {s.errors && s.errors.length > 0 && (
                          <div style={{ fontSize: 10, color: '#DC2626', padding: '4px 8px', background: '#FEF2F2', borderRadius: 4, marginTop: 4 }}>
                            <strong>Errors:</strong>
                            {s.errors.slice(0, 3).map((err: string, i: number) => (
                              <div key={i} style={{ marginTop: 2 }}>• {err}</div>
                            ))}
                            {s.errors.length > 3 && <div style={{ marginTop: 2 }}>... และอีก {s.errors.length - 3} errors</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {importResult.error && <div style={{ padding: '10px 16px', background: 'white', fontSize: 13, color: '#DC2626' }}>{importResult.error}</div>}
                <div style={{ padding: '10px 16px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setDryStats(null); setImportResult(null); setPreview(null); setOverwriteTables(new Set()); if (fileRef.current) fileRef.current.value = ''; }}>
                    <RefreshCw size={12} /> import ไฟล์ใหม่
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
