'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCcw, X, Loader2 } from 'lucide-react';

interface AvatarCropperProps {
  childId?: string;              // ถ้ามี = upload ไป Supabase, ถ้าไม่มี = add mode เก็บ blob ชั่วคราว
  value: string | null;          // current URL
  onChange: (url: string | null) => void;
  onPendingBlob?: (blob: Blob | null) => void; // สำหรับ add mode ส่ง blob กลับไปให้ parent
  defaultInitials?: string;
}

const DISPLAY = 160;
const OUTPUT  = 80;

export default function AvatarCropper({
  childId, value, onChange, onPendingBlob, defaultInitials = '?',
}: AvatarCropperProps) {
  const [src, setSrc]       = useState<string | null>(null);
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDrag] = useState(false);
  const [dragStart, setDS]  = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const rafRef    = useRef<number>(0);

  // sync preview with value prop (e.g. after save in edit mode)
  useEffect(() => { if (value !== preview) setPreview(value); }, [value]); // eslint-disable-line

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, DISPLAY, DISPLAY);
    ctx.save();
    ctx.beginPath();
    ctx.arc(DISPLAY / 2, DISPLAY / 2, DISPLAY / 2, 0, Math.PI * 2);
    ctx.clip();
    const img  = imgRef.current;
    const drawW = img.naturalWidth  * scale;
    const drawH = img.naturalHeight * scale;
    const x = (DISPLAY - drawW) / 2 + offset.x;
    const y = (DISPLAY - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(DISPLAY / 2, DISPLAY / 2, DISPLAY / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพ'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fit = DISPLAY / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
      setSrc(url);
    };
    img.src = url;
  };

  // export canvas → webp Blob
  const exportBlob = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      if (!imgRef.current) return resolve(null);
      const out = document.createElement('canvas');
      out.width = OUTPUT; out.height = OUTPUT;
      const ctx = out.getContext('2d')!;
      const img = imgRef.current;
      const r   = OUTPUT / DISPLAY;
      ctx.beginPath();
      ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
      ctx.clip();
      const drawW = img.naturalWidth  * scale * r;
      const drawH = img.naturalHeight * scale * r;
      const x = (OUTPUT - drawW) / 2 + offset.x * r;
      const y = (OUTPUT - drawH) / 2 + offset.y * r;
      ctx.drawImage(img, x, y, drawW, drawH);
      out.toBlob(resolve, 'image/webp', 0.9);
    });
  }, [scale, offset]);

  const handleSaveCrop = async () => {
    const blob = await exportBlob();
    if (!blob) return;

    // ── Edit mode: มี childId → upload ไป Supabase ทันที ──
    if (childId) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', blob, 'avatar.webp');
        fd.append('child_id', childId);
        const res  = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'upload ไม่สำเร็จ');
        const url = json.data.url;
        setPreview(url);
        onChange(url);
        setSrc(null);
      } catch (e) {
        alert(e instanceof Error ? e.message : 'upload ไม่สำเร็จ');
      } finally {
        setUploading(false);
      }
    } else {
      // ── Add mode: ยังไม่มี childId → เก็บ blob ชั่วคราว ──
      const localUrl = URL.createObjectURL(blob);
      setPreview(localUrl);
      onChange(localUrl);          // preview URL สำหรับแสดงผล
      onPendingBlob?.(blob);       // blob จริงส่งกลับให้ parent เอาไป upload หลัง save
      setSrc(null);
    }
  };

  const handleRemove = async () => {
    // ถ้าเป็น Supabase URL ให้ลบไฟล์ด้วย
    if (childId && preview && preview.includes('supabase')) {
      await fetch(`/api/upload?child_id=${childId}`, { method: 'DELETE' }).catch(() => {});
    }
    setSrc(null);
    setPreview(null);
    onChange(null);
    onPendingBlob?.(null);
  };

  // drag
  const onPD = (e: React.PointerEvent) => { if (!src) return; setDrag(true); setDS({ x: e.clientX - offset.x, y: e.clientY - offset.y }); (e.target as HTMLElement).setPointerCapture(e.pointerId); };
  const onPM = (e: React.PointerEvent) => { if (!dragging) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const onPU = () => setDrag(false);
  const onWhl = (e: React.WheelEvent) => { e.preventDefault(); setScale(s => Math.max(0.2, Math.min(5, s - e.deltaY * 0.005))); };

  const initials = (defaultInitials || '?').slice(0, 2).toUpperCase();
  const colors   = ['#E8754A','#6C5CE7','#4A90B8','#4CAF76','#F5A623','#E85C5C'];
  const bg       = colors[initials.charCodeAt(0) % colors.length];

  return (
    <div className="form-group">
      <label className="form-label">รูปโปรไฟล์</label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar preview */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {preview ? (
            <img src={preview} alt="profile"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700, border: '2px solid #E5E7EB' }}>
              {initials}
            </div>
          )}
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {preview && !uploading && (
            <button type="button" onClick={handleRemove}
              style={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderRadius: '50%', background: '#E85C5C', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <X size={10} />
            </button>
          )}
        </div>

        {/* Upload button */}
        <div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload size={13} /> {preview ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
          </button>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {childId ? 'อัปโหลดไป Supabase Storage อัตโนมัติ' : 'บันทึกหลัง save นักเรียน'}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP · crop เป็น 80×80</p>
        </div>
      </div>

      {/* Crop editor */}
      {src && (
        <div style={{ marginTop: 14, background: '#F7F5F2', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, textAlign: 'center' }}>
            ลากปรับตำแหน่ง · scroll หรือ slider ซูม
          </p>
          <canvas ref={canvasRef} width={DISPLAY} height={DISPLAY}
            onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
            onWheel={onWhl}
            style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', borderRadius: '50%', boxShadow: '0 0 0 4px white, 0 0 0 6px #6366f1' }} />

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: DISPLAY + 40 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.max(0.2, s - 0.1))}><ZoomOut size={13} /></button>
            <input type="range" min={0.2} max={5} step={0.01} value={scale}
              onChange={e => setScale(Number(e.target.value))} style={{ flex: 1, accentColor: '#6366f1' }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.min(5, s + 0.1))}><ZoomIn size={13} /></button>
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => { setScale(DISPLAY / Math.min(imgRef.current?.naturalWidth ?? DISPLAY, imgRef.current?.naturalHeight ?? DISPLAY)); setOffset({ x: 0, y: 0 }); }}>
              <RotateCcw size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSrc(null)}>ยกเลิก</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveCrop} disabled={uploading}>
              {uploading ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> กำลัง upload...</> : '✓ ใช้รูปนี้'}
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
