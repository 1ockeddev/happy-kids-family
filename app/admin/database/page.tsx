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
  app_user:             'ผู้ใช้งาน',
  child:                'นักเรียน',
  cohort:               'ห้องเรียน',
  parent_child:         'ผู้ปกครอง-นักเรียน',
  teacher_permission:   'สิทธิ์ครู',
  enrollment:           'การลงทะเบียน',
  daily:                'บันทึกรายวัน',
  attendance:           'การเข้าเรียน',
  daily_report:         'รายงานรายวัน',
  behavior_category:    'หมวดหมู่พฤติกรรม',
  behavior_item:        'รายการพฤติกรรม',
  child_behavior_score: 'คะแนนพฤติกรรม',
  child_excretion:      'การขับถ่าย',
  holidays:             'วันหยุด',
  user_analytics:       'Analytics (การใช้งาน)',
  line_flex_templates:  'LINE Flex Templates',
  line_groups:          'LINE Groups',
  line_group_members:   'LINE Group Members',
  line_group_events:    'LINE Group Events',
};

const TABLE_COLUMNS: Record<string, string[]> = {
  app_user:             ['id','line_user_id','role','status','display_name','display_name_th','line_display_name','picture_url','can_select_cohort','default_cohort_id','created_at'],
  child:                ['id','name_en','name_th','firstname_en','lastname_en','firstname_th','lastname_th','nickname_en','nickname_th','birthdate','photo_url','deleted_at','created_at'],
  cohort:               ['id','name','level','academic_year','start_date','end_date','created_at'],
  parent_child:         ['parent_id','child_id'],
  teacher_permission:   ['user_id','can_manage_daily','can_manage_attendance','can_manage_report'],
  enrollment:           ['id','child_id','cohort_id','start_date','end_date','graduated','created_at'],
  daily:                ['id','cohort_id','date','activity','food','fruit','note','created_by','updated_by','updated_at','created_at'],
  attendance:           ['id','daily_id','child_id','status','note','created_by','updated_by','updated_at','created_at'],
  daily_report:         ['id','daily_id','child_id','nap_from','nap_to','nap_note','milk1','milk1_note','milk2','milk2_note','food_amount','food_note','fruit_amount','fruit_note','note','created_by','updated_by','updated_at','created_at'],
  behavior_category:    ['id','name_en','name_th','sort_order','is_active','cohort_ids','created_at'],
  behavior_item:        ['id','category_id','name_en','name_th','max_score','sort_order','is_active','created_at'],
  child_behavior_score: ['id','daily_id','child_id','item_id','score','note','created_at'],
  child_excretion:      ['id','daily_id','child_id','time','type','action','created_at'],
  holidays:             ['id','date','name_th','name_en','type','cohort_id','created_at','updated_at'],
  user_analytics:       ['id','user_id','event_type','page_path','from_path','to_path','element_type','element_label','duration_seconds','timestamp','session_id','user_agent','viewport_width','viewport_height','created_at'],
  line_flex_templates:  ['id','name','description','template','created_at','updated_at'],
  line_groups:          ['id','line_group_id','group_name','group_type','status','picture_url','joined_at','left_at','created_at','updated_at'],
  line_group_members:   ['id','group_id','user_id','line_user_id','display_name','picture_url','role','joined_at','left_at','status','created_at','updated_at'],
  line_group_events:    ['id','group_id','line_user_id','event_type','message_type','message_text','message_data','created_at'],
};

export default function DatabasePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  // export
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'sql'>('json');
  const [selectedExportTables, setSelectedExportTables] = useState<Set<string>>(new Set(Object.keys(TABLE_LABELS)));
  
  // SQL Query Builder
  const [showSqlBuilder, setShowSqlBuilder] = useState(false);
  const [sqlTable, setSqlTable] = useState<string>('');
  const [sqlFields, setSqlFields] = useState<string[]>([]);
  const [sqlWhere, setSqlWhere] = useState<string>('');
  const [sqlLimit, setSqlLimit] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  // UPDATE Record
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateTable, setUpdateTable] = useState<string>('');
  const [updateRecordId, setUpdateRecordId] = useState<string>('');
  const [updateFields, setUpdateFields] = useState<Record<string, any>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [fetchingRecord, setFetchingRecord] = useState(false);

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

  // ── SQL Query Builder ───────────────────────────────────────
  const executeSqlQuery = async () => {
    if (!sqlTable) {
      alert('กรุณาเลือก Table');
      return;
    }
    
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);
    
    try {
      const params = new URLSearchParams({
        table: sqlTable,
        fields: sqlFields.length > 0 ? sqlFields.join(',') : '*',
      });
      
      if (sqlWhere) params.append('where', sqlWhere);
      if (sqlLimit) params.append('limit', sqlLimit);
      
      const res = await fetch(`/api/db-query?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Query failed');
      }
      
      setSqlResult(data.data || []);
    } catch (err) {
      setSqlError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setSqlLoading(false);
    }
  };

  // ── UPDATE Record ───────────────────────────────────────────
  const fetchRecordForUpdate = async () => {
    if (!updateTable || !updateRecordId) {
      alert('กรุณาเลือก Table และใส่ Record ID');
      return;
    }

    setFetchingRecord(true);
    setUpdateResult(null);
    
    try {
      const res = await fetch(`/api/db-update?table=${updateTable}&id=${updateRecordId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูล');
      }
      
      setUpdateFields(data.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setUpdateFields({});
    } finally {
      setFetchingRecord(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!updateTable || !updateRecordId) {
      alert('กรุณาเลือก Table และใส่ Record ID');
      return;
    }

    if (Object.keys(updateFields).length === 0) {
      alert('กรุณาโหลดข้อมูลก่อน');
      return;
    }

    // Remove id from updates (we use it in WHERE clause)
    const { id, created_at, updated_at, ...updates } = updateFields;
    
    if (Object.keys(updates).length === 0) {
      alert('ไม่มีฟิลด์ที่สามารถอัปเดตได้');
      return;
    }

    setUpdateLoading(true);
    setUpdateResult(null);
    
    try {
      const res = await fetch('/api/db-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: updateTable,
          id: updateRecordId,
          updates,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }
      
      setUpdateResult({
        success: true,
        message: `อัปเดตสำเร็จ ${data.count} รายการ`,
        data: data.data,
      });
      
      // Refresh the record
      setTimeout(() => {
        fetchRecordForUpdate();
      }, 500);
    } catch (err) {
      setUpdateResult({
        success: false,
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateFieldValue = (field: string, value: any) => {
    setUpdateFields(prev => ({ ...prev, [field]: value }));
  };
  
  const downloadSqlResult = () => {
    if (!sqlResult || sqlResult.length === 0) return;
    
    const fields = sqlFields.length > 0 ? sqlFields : Object.keys(sqlResult[0]);
    let sql = `-- Query Result from ${sqlTable}\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    for (const row of sqlResult) {
      const values = fields.map(field => {
        const val = row[field];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return String(val);
      }).join(', ');
      
      sql += `INSERT INTO "${sqlTable}" (${fields.map(f => `"${f}"`).join(', ')}) VALUES (${values});\n`;
    }
    
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sqlTable}-${new Date().toISOString().slice(0,10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
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
                <button
                  onClick={() => setExportFormat('sql')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: exportFormat === 'sql' ? '2px solid #6C5CE7' : '1px solid #E5E7EB',
                    background: exportFormat === 'sql' ? '#F0EEFF' : 'white',
                    color: exportFormat === 'sql' ? '#6C5CE7' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: exportFormat === 'sql' ? 700 : 400,
                    fontSize: 14
                  }}
                >
                  💾 SQL
                </button>
              </div>
              {exportFormat === 'csv' && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                  CSV จะ export เป็นไฟล์ ZIP (แต่ละ table แยกไฟล์)
                </p>
              )}
              {exportFormat === 'sql' && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                  SQL จะสร้าง INSERT statements สำหรับนำเข้าข้อมูล
                </p>
              )}
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
                    <span style={{ fontSize: 12, color: selectedExportTables.has(t) ? '#4C1D95' : '#6B7280', fontWeight: selectedExportTables.has(t) ? 600 : 400 }}>
                      {l}
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400, marginLeft: 4 }}>({t})</span>
                    </span>
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

        {/* ── UPDATE Record ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div 
            onClick={() => setShowUpdate(!showUpdate)}
            style={{ 
              background: '#E0E7FF', 
              padding: '14px 18px', 
              borderBottom: '1px solid #E5E7EB', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none'
            }}>
            <RefreshCw size={18} style={{ color: '#4F46E5' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#312E81' }}>Update Record</h2>
              <p style={{ fontSize: 12, color: '#4F46E5', marginTop: 2 }}>แก้ไขข้อมูลในตาราง โดยระบุ Table และ Record ID</p>
            </div>
            {showUpdate ? <ChevronUp size={18} style={{ color: '#4F46E5' }} /> : <ChevronDown size={18} style={{ color: '#4F46E5' }} />}
          </div>
          
          {showUpdate && (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Table selector */}
              <div>
                <label className="form-label">เลือก Table</label>
                <select 
                  value={updateTable} 
                  onChange={(e) => {
                    setUpdateTable(e.target.value);
                    setUpdateRecordId('');
                    setUpdateFields({});
                    setUpdateResult(null);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 8, 
                    border: '1px solid #E5E7EB',
                    fontSize: 14,
                    background: 'white'
                  }}>
                  <option value="">-- เลือก Table --</option>
                  {Object.entries(TABLE_LABELS).map(([table, label]) => (
                    <option key={table} value={table}>
                      {label} ({table})
                    </option>
                  ))}
                </select>
              </div>

              {/* Record ID input */}
              {updateTable && (
                <div>
                  <label className="form-label">Record ID</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={updateRecordId}
                      onChange={(e) => setUpdateRecordId(e.target.value)}
                      placeholder="ใส่ ID ของ record ที่ต้องการแก้ไข"
                      style={{ 
                        flex: 1,
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        border: '1px solid #E5E7EB',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        background: 'white'
                      }}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={fetchRecordForUpdate}
                      disabled={fetchingRecord || !updateRecordId}
                      style={{ background: '#4F46E5', whiteSpace: 'nowrap' }}>
                      {fetchingRecord 
                        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> โหลด...</>
                        : <>โหลดข้อมูล</>}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    💡 กดโหลดข้อมูลเพื่อแสดงฟิลด์ที่สามารถแก้ไขได้
                  </p>
                </div>
              )}

              {/* Edit fields */}
              {Object.keys(updateFields).length > 0 && (
                <div>
                  <label className="form-label">แก้ไขข้อมูล</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 10, 
                    maxHeight: 400, 
                    overflowY: 'auto', 
                    padding: 12, 
                    background: '#F9FAFB', 
                    borderRadius: 8,
                    border: '1px solid #E5E7EB'
                  }}>
                    {Object.entries(updateFields).map(([field, value]) => {
                      const isReadOnly = ['id', 'created_at', 'updated_at'].includes(field);
                      const isJsonField = typeof value === 'object' && value !== null;
                      
                      return (
                        <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            color: isReadOnly ? '#9CA3AF' : '#374151',
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            {field}
                            {isReadOnly && <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>(read-only)</span>}
                          </label>
                          {isJsonField ? (
                            <textarea
                              value={JSON.stringify(value, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  updateFieldValue(field, parsed);
                                } catch {
                                  // Invalid JSON, keep as string for now
                                }
                              }}
                              disabled={isReadOnly}
                              rows={5}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #E5E7EB',
                                fontSize: 11,
                                fontFamily: 'monospace',
                                background: isReadOnly ? '#F3F4F6' : 'white',
                                color: isReadOnly ? '#9CA3AF' : '#1F2937',
                                resize: 'vertical'
                              }}
                            />
                          ) : (
                            <input
                              type="text"
                              value={value === null ? '' : String(value)}
                              onChange={(e) => updateFieldValue(field, e.target.value || null)}
                              disabled={isReadOnly}
                              placeholder={value === null ? 'NULL' : ''}
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: 6, 
                                border: '1px solid #E5E7EB',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                background: isReadOnly ? '#F3F4F6' : 'white',
                                color: isReadOnly ? '#9CA3AF' : '#1F2937'
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                    ⚠️ ฟิลด์ id, created_at, updated_at จะไม่ถูกแก้ไข
                  </p>
                </div>
              )}

              {/* Update button */}
              {Object.keys(updateFields).length > 0 && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleUpdateRecord} 
                  disabled={updateLoading}
                  style={{ width: '100%', justifyContent: 'center', background: '#4F46E5' }}>
                  {updateLoading 
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลังอัปเดต...</>
                    : <><RefreshCw size={15} /> อัปเดตข้อมูล</>}
                </button>
              )}

              {/* Result display */}
              {updateResult && (
                <div style={{ 
                  background: updateResult.success ? '#F0FDF4' : '#FEF2F2', 
                  border: `1px solid ${updateResult.success ? '#86EFAC' : '#FCA5A5'}`, 
                  borderRadius: 8, 
                  padding: 12 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {updateResult.success ? (
                      <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                    )}
                    <p style={{ fontSize: 12, color: updateResult.success ? '#064E3B' : '#991B1B', margin: 0 }}>
                      {updateResult.message}
                    </p>
                  </div>
                  {updateResult.success && updateResult.data && updateResult.data.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: 'white', borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#374151' }}>
                        {JSON.stringify(updateResult.data[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SQL Query Builder ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div 
            onClick={() => setShowSqlBuilder(!showSqlBuilder)}
            style={{ 
              background: '#FEF3C7', 
              padding: '14px 18px', 
              borderBottom: '1px solid #E5E7EB', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none'
            }}>
            <Database size={18} style={{ color: '#D97706' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#78350F' }}>SQL Query Builder</h2>
              <p style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>เลือก table, field, WHERE clause แล้วดู result หรือ download เป็น SQL</p>
            </div>
            {showSqlBuilder ? <ChevronUp size={18} style={{ color: '#D97706' }} /> : <ChevronDown size={18} style={{ color: '#D97706' }} />}
          </div>
          
          {showSqlBuilder && (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Table selector */}
              <div>
                <label className="form-label">เลือก Table</label>
                <select 
                  value={sqlTable} 
                  onChange={(e) => {
                    setSqlTable(e.target.value);
                    setSqlFields([]);
                    setSqlResult(null);
                    setSqlError(null);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 8, 
                    border: '1px solid #E5E7EB',
                    fontSize: 14,
                    background: 'white'
                  }}>
                  <option value="">-- เลือก Table --</option>
                  {Object.entries(TABLE_LABELS).map(([table, label]) => (
                    <option key={table} value={table}>
                      {label} ({table})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field selector */}
              {sqlTable && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>เลือก Fields (เว้นว่างเพื่อเลือกทั้งหมด)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setSqlFields(TABLE_COLUMNS[sqlTable] || [])}
                        style={{ fontSize: 11 }}>
                        เลือกทั้งหมด
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setSqlFields([])}
                        style={{ fontSize: 11 }}>
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 6, 
                    maxHeight: 200, 
                    overflowY: 'auto', 
                    padding: 8, 
                    background: '#F9FAFB', 
                    borderRadius: 8 
                  }}>
                    {(TABLE_COLUMNS[sqlTable] || []).map((field) => (
                      <label 
                        key={field} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          cursor: 'pointer', 
                          padding: '4px 10px', 
                          borderRadius: 6, 
                          background: sqlFields.includes(field) ? '#DBEAFE' : 'white', 
                          border: '1px solid', 
                          borderColor: sqlFields.includes(field) ? '#3B82F6' : '#E5E7EB' 
                        }}>
                        <input
                          type="checkbox"
                          checked={sqlFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSqlFields([...sqlFields, field]);
                            } else {
                              setSqlFields(sqlFields.filter(f => f !== field));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ 
                          fontSize: 12, 
                          color: sqlFields.includes(field) ? '#1E3A8A' : '#6B7280', 
                          fontWeight: sqlFields.includes(field) ? 600 : 400,
                          fontFamily: 'monospace'
                        }}>
                          {field}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                    เลือกแล้ว: {sqlFields.length} / {(TABLE_COLUMNS[sqlTable] || []).length} fields
                    {sqlFields.length === 0 && ' (จะเลือกทั้งหมด)'}
                  </p>
                </div>
              )}

              {/* WHERE clause */}
              {sqlTable && (
                <div>
                  <label className="form-label">WHERE Clause (optional)</label>
                  <input
                    type="text"
                    value={sqlWhere}
                    onChange={(e) => setSqlWhere(e.target.value)}
                    placeholder="เช่น: status = 'active' AND created_at > '2024-01-01'"
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      border: '1px solid #E5E7EB',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      background: 'white'
                    }}
                  />
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    ⚠️ ใช้ syntax SQL ธรรมดา (ห้ามมี DROP, DELETE, TRUNCATE, ALTER, CREATE, INSERT, UPDATE)
                  </p>
                </div>
              )}

              {/* LIMIT */}
              {sqlTable && (
                <div>
                  <label className="form-label">LIMIT (optional)</label>
                  <input
                    type="number"
                    value={sqlLimit}
                    onChange={(e) => setSqlLimit(e.target.value)}
                    placeholder="จำนวนแถวสูงสุด เช่น 100"
                    min="1"
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      border: '1px solid #E5E7EB',
                      fontSize: 13,
                      background: 'white'
                    }}
                  />
                </div>
              )}

              {/* Execute button */}
              {sqlTable && (
                <button 
                  className="btn btn-primary" 
                  onClick={executeSqlQuery} 
                  disabled={sqlLoading}
                  style={{ width: '100%', justifyContent: 'center', background: '#D97706' }}>
                  {sqlLoading 
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> กำลังดึงข้อมูล...</>
                    : <><Database size={15} /> Execute Query</>}
                </button>
              )}

              {/* Error display */}
              {sqlError && (
                <div style={{ 
                  background: '#FEF2F2', 
                  border: '1px solid #FCA5A5', 
                  borderRadius: 8, 
                  padding: 12 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{sqlError}</p>
                  </div>
                </div>
              )}

              {/* Result display */}
              {sqlResult && (
                <div style={{ 
                  border: '1px solid #E5E7EB', 
                  borderRadius: 12, 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    background: '#F0FDF4', 
                    padding: '12px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={18} style={{ color: '#059669' }} />
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#064E3B', margin: 0 }}>
                        ผลลัพธ์: {sqlResult.length} แถว
                      </p>
                    </div>
                    {sqlResult.length > 0 && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={downloadSqlResult}
                        style={{ fontSize: 12 }}>
                        <Download size={13} /> Download SQL
                      </button>
                    )}
                  </div>
                  
                  {sqlResult.length > 0 ? (
                    <div style={{ 
                      overflowX: 'auto', 
                      maxHeight: 400, 
                      overflowY: 'auto',
                      background: 'white'
                    }}>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: 12
                      }}>
                        <thead style={{ 
                          background: '#F9FAFB', 
                          position: 'sticky', 
                          top: 0,
                          zIndex: 1
                        }}>
                          <tr>
                            {Object.keys(sqlResult[0]).map((key) => (
                              <th key={key} style={{ 
                                padding: '8px 12px', 
                                textAlign: 'left', 
                                borderBottom: '2px solid #E5E7EB',
                                fontWeight: 700,
                                color: '#374151',
                                fontFamily: 'monospace',
                                fontSize: 11
                              }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.map((row, idx) => (
                            <tr key={idx} style={{ 
                              borderBottom: '1px solid #F3F4F6',
                              background: idx % 2 === 0 ? 'white' : '#F9FAFB'
                            }}>
                              {Object.values(row).map((val: any, colIdx) => (
                                <td key={colIdx} style={{ 
                                  padding: '8px 12px',
                                  color: '#6B7280',
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {val === null ? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>NULL</span> : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                      ไม่พบข้อมูล
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
