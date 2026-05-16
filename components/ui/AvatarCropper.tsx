'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface AvatarCropperProps {
  value: string | null;           // current photo_url (data URL or https)
  onChange: (dataUrl: string | null) => void;
  defaultInitials?: string;       // fallback initials e.g. "EM"
}

const OUTPUT_SIZE = 160;  // 160x160 px output

export default function AvatarCropper({ value, onChange, defaultInitials = '?' }: AvatarCropperProps) {
  const [src, setSrc]         = useState<string | null>(null);   // raw image src for editing
  const [scale, setScale]     = useState(1);
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<string | null>(value);  // saved cropped result

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const rafRef     = useRef<number>(0);

  // display size of the crop circle
  const DISPLAY = 160;

  // ── draw onto visible canvas ──────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d')!;
    const img = imgRef.current;
    ctx.clearRect(0, 0, DISPLAY, DISPLAY);

    // clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(DISPLAY / 2, DISPLAY / 2, DISPLAY / 2, 0, Math.PI * 2);
    ctx.clip();

    // draw image
    const drawW = img.naturalWidth  * scale;
    const drawH = img.naturalHeight * scale;
    const x = (DISPLAY - drawW) / 2 + offset.x;
    const y = (DISPLAY - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();

    // border
    ctx.strokeStyle = '#6C5CE7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DISPLAY / 2, DISPLAY / 2, DISPLAY / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // ── load file ────────────────────────────────────────────
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพ'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // fit-to-circle initial scale
      const fit = DISPLAY / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
      setSrc(url);
    };
    img.src = url;
  };

  // ── export 160x160 webp ────────────────────────────────────
  const exportCrop = useCallback((): string | null => {
    if (!imgRef.current) return null;
    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE; out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d')!;
    const img = imgRef.current;
    const ratio = OUTPUT_SIZE / DISPLAY;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const drawW = img.naturalWidth  * scale * ratio;
    const drawH = img.naturalHeight * scale * ratio;
    const x = (OUTPUT_SIZE - drawW) / 2 + offset.x * ratio;
    const y = (OUTPUT_SIZE - drawH) / 2 + offset.y * ratio;
    ctx.drawImage(img, x, y, drawW, drawH);

    return out.toDataURL('image/webp', 0.9);
  }, [scale, offset]);

  const handleSaveCrop = () => {
    const dataUrl = exportCrop();
    if (dataUrl) { setPreview(dataUrl); onChange(dataUrl); setSrc(null); }
  };

  const handleRemove = () => { setSrc(null); setPreview(null); onChange(null); };

  // ── drag ────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (!src) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onPointerUp = () => setDragging(false);

  // ── wheel zoom ──────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.2, Math.min(5, s - e.deltaY * 0.005)));
  };

  // ── initials avatar ─────────────────────────────────────
  const initials = (defaultInitials || '?').slice(0, 2).toUpperCase();
  const colors = ['#E8754A','#6C5CE7','#4A90B8','#4CAF76','#F5A623','#E85C5C'];
  const colorIdx = initials.charCodeAt(0) % colors.length;

  return (
    <div className="form-group">
      <label className="form-label">รูปโปรไฟล์</label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* ── Preview / Default avatar ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {preview ? (
            <img src={preview} alt="profile"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: colors[colorIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700, fontFamily: 'Prompt, sans-serif', border: '2px solid #E5E7EB' }}>
              {initials}
            </div>
          )}
          {preview && (
            <button type="button" onClick={handleRemove}
              style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#E85C5C', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <X size={10} />
            </button>
          )}
        </div>

        {/* ── Upload button ── */}
        <div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {preview ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
          </button>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            PNG, JPG, WEBP · บันทึกเป็น 160x160 webp
          </p>
        </div>
      </div>

      {/* ── Crop editor ── */}
      {src && (
        <div style={{ marginTop: 16, background: '#F7F5F2', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
            ลากเพื่อปรับตำแหน่ง · scroll เพื่อซูม · พื้นที่วงกลม = พื้นที่แสดงผล
          </p>

          {/* Canvas crop area */}
          <canvas ref={canvasRef}
            width={DISPLAY} height={DISPLAY}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', borderRadius: '50%', boxShadow: '0 0 0 4px white, 0 0 0 5px #E5E7EB' }}
          />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: DISPLAY + 40 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.max(0.2, s - 0.1))}>
              <ZoomOut size={13} />
            </button>
            <input type="range" min={0.2} max={5} step={0.01} value={scale}
              onChange={e => setScale(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#6C5CE7' }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.min(5, s + 0.1))}>
              <ZoomIn size={13} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" title="รีเซ็ต"
              onClick={() => { setScale(DISPLAY / Math.min(imgRef.current?.naturalWidth ?? DISPLAY, imgRef.current?.naturalHeight ?? DISPLAY)); setOffset({ x: 0, y: 0 }); }}>
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Save / Cancel */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSrc(null)}>ยกเลิก</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveCrop}>
              ✓ ใช้รูปนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
