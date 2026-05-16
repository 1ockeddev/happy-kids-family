'use client';
import { useState, useRef } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, Loader2, Database, RefreshCw, FileJson } from 'lucide-react';

interface ImportStats {
  [table: string]: { inserted: number; skipped: number };
}

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
};

export default function DatabasePage() {
  // export
  const [exporting, setExporting]   = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // import
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; stats?: ImportStats; error?: string } | null>(null);
  const [preview, setPreview]     = useState<{ exported_at: string; rowCounts: Record<string, number> } | null>(null);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true); setExportDone(false);
    try {
      const res  = await fetch('/api/db-export');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const cd   = res.headers.get('content-disposition') ?? '';
      const name = cd.match(/filename="([^"]+)"/)?.[1] ?? 'backup.json';
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'export ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  };

  // ── File pick ───────────────────────────────────────────────
  const handleFilePick = (f: File) => {
    setFile(f); setImportResult(null); setPreview(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (json?.tables) {
          const rowCounts: Record<string, number> = {};
          for (const [t, rows] of Object.entries(json.tables)) {
            rowCounts[t] = Array.isArray(rows) ? rows.length : 0;
          }
          setPreview({ exported_at: json.exported_at ?? '', rowCounts });
        }
      } catch { /* ignore */ }
    };
    reader.readAsText(f);
  };

  // ── Import ──────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setImportResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res  = await fetch('/api/db-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'import ไม่สำเร็จ');
      setImportResult({ ok: true, stats: data.data.stats });
    } catch (e) {
      setImportResult({ ok: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' });
    } finally {
      setImporting(false);
    }
  };

  const totalInserted = importResult?.stats
    ? Object.values(importResult.stats).reduce((a, b) => a + b.inserted, 0)
    : 0;
  const totalSkipped = importResult?.stats
    ? Object.values(importResult.stats).reduce((a, b) => a + b.skipped, 0)
    : 0;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={20} style={{ color: '#6C5CE7' }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Prompt, sans-serif' }}>นำเข้า / ส่งออกข้อมูล</h1>
            <p style={{ color: '#9CA3AF', fontSize: 12 }}>Backup และ Restore ฐานข้อมูลทั้งหมด</p>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>

        {/* ── Export Card ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: '#F0EEFF', padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={18} style={{ color: '#6C5CE7' }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#4C1D95' }}>ส่งออกข้อมูล (Export)</h2>
              <p style={{ fontSize: 12, color: '#7C3AED', marginTop: 2 }}>ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
            </div>
          </div>
          <div style={{ padding: '18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {Object.entries(TABLE_LABELS).map(([t, l]) => (
                <span key={t} style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', padding: '3px 10px', borderRadius: 99 }}>{l}</span>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}
              style={{ width: '100%', justifyContent: 'center', background: '#6C5CE7' }}>
              {exporting
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลัง export...</>
                : exportDone
                  ? <><CheckCircle size={15} /> ดาวน์โหลดแล้ว!</>
                  : <><Download size={15} /> Export ทั้งหมด</>}
            </button>
          </div>
        </div>

        {/* ── Import Card ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: '#EBF7F0', padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload size={18} style={{ color: '#059669' }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#064E3B' }}>นำเข้าข้อมูล (Import)</h2>
              <p style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>อัปโหลดไฟล์ JSON จากการ Export เดิม</p>
            </div>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Drop zone ── */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFilePick(f); }}
              style={{
                border: `2px dashed ${file ? '#059669' : '#D1D5DB'}`,
                borderRadius: 12, padding: '24px 16px', textAlign: 'center',
                cursor: 'pointer', background: file ? '#F0FDF4' : '#FAFAFA',
                transition: 'all .15s',
              }}>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFilePick(e.target.files[0])} />
              {file ? (
                <>
                  <FileJson size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, color: '#065F46', fontSize: 14 }}>{file.name}</p>
                  <p style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
                    {(file.size / 1024).toFixed(1)} KB · คลิกเพื่อเปลี่ยนไฟล์
                  </p>
                </>
              ) : (
                <>
                  <Upload size={28} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
                  <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>คลิกหรือลากไฟล์ JSON มาวาง</p>
                  <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>เฉพาะไฟล์จากการ Export เท่านั้น</p>
                </>
              )}
            </div>

            {/* ── File preview ── */}
            {preview && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
                  📦 ข้อมูลในไฟล์
                  {preview.exported_at && (
                    <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
                      (Export เมื่อ {new Date(preview.exported_at).toLocaleString('th-TH')})
                    </span>
                  )}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {Object.entries(preview.rowCounts).filter(([, n]) => n > 0).map(([t, n]) => (
                    <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                      <span>{TABLE_LABELS[t] ?? t}</span>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Warning ── */}
            {file && !importResult && (
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
                ⚠️ การ import จะใช้ <strong>ON CONFLICT DO NOTHING</strong> — ข้อมูลที่มีอยู่แล้วจะไม่ถูกเขียนทับ
              </div>
            )}

            {/* ── Import button ── */}
            {file && !importResult && (
              <button className="btn btn-primary" onClick={handleImport} disabled={importing}
                style={{ width: '100%', justifyContent: 'center', background: '#059669' }}>
                {importing
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลัง import...</>
                  : <><Upload size={15} /> นำเข้าข้อมูล</>}
              </button>
            )}

            {/* ── Result ── */}
            {importResult && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${importResult.ok ? '#D1FAE5' : '#FECACA'}` }}>
                <div style={{ padding: '12px 16px', background: importResult.ok ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {importResult.ok
                    ? <CheckCircle size={18} style={{ color: '#059669' }} />
                    : <AlertCircle size={18} style={{ color: '#DC2626' }} />}
                  <p style={{ fontWeight: 700, fontSize: 14, color: importResult.ok ? '#064E3B' : '#991B1B' }}>
                    {importResult.ok ? `นำเข้าสำเร็จ — ${totalInserted} แถว` : `เกิดข้อผิดพลาด`}
                  </p>
                </div>

                {importResult.ok && importResult.stats && (
                  <div style={{ padding: '12px 16px', background: 'white' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>✅ นำเข้า {totalInserted} แถว</div>
                      {totalSkipped > 0 && <div style={{ fontSize: 13, color: '#D97706', fontWeight: 700 }}>⏭ ข้าม {totalSkipped} แถว (มีอยู่แล้ว)</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(importResult.stats).filter(([, s]) => s.inserted > 0 || s.skipped > 0).map(([t, s]) => (
                        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                          <span style={{ color: '#6B7280' }}>{TABLE_LABELS[t] ?? t}</span>
                          <span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>+{s.inserted}</span>
                            {s.skipped > 0 && <span style={{ color: '#D97706', marginLeft: 6 }}>/{s.skipped} ข้าม</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.error && (
                  <div style={{ padding: '10px 16px', background: 'white', fontSize: 13, color: '#DC2626' }}>
                    {importResult.error}
                  </div>
                )}

                <div style={{ padding: '10px 16px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setImportResult(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                    <RefreshCw size={12} /> นำเข้าไฟล์ใหม่
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── How-to note ── */}
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>📖 วิธีใช้ sync ระหว่าง Local ↔ Supabase</p>
          <ol style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Export จาก DB ต้นทาง (local หรือ Supabase)',
              'เข้าหน้า /admin/database บน DB ปลายทาง',
              'อัปโหลดไฟล์ JSON แล้วกด "นำเข้าข้อมูล"',
              'ข้อมูลที่มีอยู่แล้วจะไม่ถูกเขียนทับ (safe)',
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 12, color: '#64748B' }}>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}
