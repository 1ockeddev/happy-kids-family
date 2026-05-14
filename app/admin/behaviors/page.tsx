'use client';
import { useState, useEffect, useCallback } from 'react';
import { behaviorCategoriesApi, behaviorItemsApi, cohortsApi } from '@/lib/api-client';
import { BehaviorCategory, BehaviorItem, Cohort } from '@/types';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface CategoryWithItems extends BehaviorCategory { items: BehaviorItem[] }

export default function BehaviorsPage() {
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [cohorts, setCohorts]       = useState<Cohort[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [catModal, setCatModal]     = useState<'add' | 'edit' | 'delete' | null>(null);
  const [itemModal, setItemModal]   = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selectedCat, setSelectedCat]   = useState<CategoryWithItems | null>(null);
  const [selectedItem, setSelectedItem] = useState<BehaviorItem | null>(null);
  const [catForm, setCatForm]   = useState({ name_en: '', name_th: '', sort_order: 0, cohort_ids: [] as string[] });
  const [itemForm, setItemForm] = useState({ name_en: '', name_th: '', max_score: 3, sort_order: 0, category_id: '' });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await behaviorCategoriesApi.list() as CategoryWithItems[];
      setCategories(rows);
      if (rows.length > 0 && !expandedCat) setExpandedCat(rows[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    cohortsApi.list().then(rows => setCohorts(rows as Cohort[])).catch(() => {});
  }, []);

  const handleSaveCat = async () => {
    setSaving(true);
    try {
      catModal === 'add'
        ? await behaviorCategoriesApi.create(catForm)
        : await behaviorCategoriesApi.update(selectedCat!.id, catForm);
      setCatModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleSaveItem = async () => {
    setSaving(true);
    try {
      itemModal === 'add'
        ? await behaviorItemsApi.create(itemForm)
        : await behaviorItemsApi.update(selectedItem!.id, itemForm);
      setItemModal(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const toggleCohort = (id: string) =>
    setCatForm(f => ({
      ...f,
      cohort_ids: f.cohort_ids.includes(id)
        ? f.cohort_ids.filter(x => x !== id)
        : [...f.cohort_ids, id],
    }));

  return (
    <>
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A2E', fontFamily: 'Prompt, sans-serif' }}>ประเมินพฤติกรรม</h1>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '2px' }}>จัดการหมวดหมู่และรายการประเมิน ผูกกับห้องเรียน</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={load}><RefreshCw size={14} /></button>
            <button className="btn btn-primary" onClick={() => {
              setCatForm({ name_en: '', name_th: '', sort_order: categories.length + 1, cohort_ids: [] });
              setCatModal('add');
            }}>
              <Plus size={15} /> เพิ่มหมวดหมู่
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FDECEC', borderRadius: 8, color: '#E85C5C', marginBottom: 12, fontSize: 14 }}><AlertCircle size={15} />{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 56, background: 'white', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🧠</p>
            <p>ยังไม่มีหมวดหมู่ กด &ldquo;เพิ่มหมวดหมู่&rdquo; เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categories.map(cat => {
              const isOpen = expandedCat === cat.id;
              const items: BehaviorItem[] = cat.items ?? [];
              const catCohorts = cohorts.filter(c => (cat.cohort_ids ?? []).includes(c.id));
              return (
                <div key={cat.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Category row */}
                  <div
                    style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: isOpen ? '1px solid #F3F4F6' : 'none' }}
                    onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                  >
                    {isOpen ? <ChevronDown size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{cat.name_th}</span>
                        <span style={{ color: '#9CA3AF', fontSize: 13 }}>{cat.name_en}</span>
                      </div>
                      {/* cohort badges */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {catCohorts.length === 0 ? (
                          <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 8px', borderRadius: 99 }}>ทุกห้อง</span>
                        ) : catCohorts.map(c => (
                          <span key={c.id} style={{ fontSize: 11, color: '#4A90B8', background: '#EBF4FA', padding: '1px 8px', borderRadius: 99 }}>{c.name} ({c.level})</span>
                        ))}
                      </div>
                    </div>
                    <span className="badge badge-teacher" style={{ marginRight: 8, flexShrink: 0 }}>{items.length} รายการ</span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setSelectedCat(cat);
                        setCatForm({ name_en: cat.name_en, name_th: cat.name_th, sort_order: cat.sort_order, cohort_ids: cat.cohort_ids ?? [] });
                        setCatModal('edit');
                      }}><Pencil size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setSelectedCat(cat); setCatModal('delete'); }}><Trash2 size={12} /></button>
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setItemForm({ name_en: '', name_th: '', max_score: 3, sort_order: items.length + 1, category_id: cat.id });
                        setItemModal('add');
                      }}><Plus size={12} /> เพิ่ม</button>
                    </div>
                  </div>

                  {/* Items */}
                  {isOpen && (
                    <div>
                      {items.length === 0
                        ? <p style={{ padding: '14px 20px', color: '#9CA3AF', fontSize: 14 }}>ยังไม่มีรายการ</p>
                        : items.map(item => (
                          <div key={item.id} style={{ padding: '11px 20px 11px 52px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F9FAFB' }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 14 }}>{item.name_th}</span>
                              <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>{item.name_en}</span>
                            </div>
                            <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
                              max {item.max_score} คะแนน
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => {
                                setSelectedItem(item);
                                setItemForm({ name_en: item.name_en, name_th: item.name_th, max_score: item.max_score, sort_order: item.sort_order, category_id: item.category_id ?? '' });
                                setItemModal('edit');
                              }}><Pencil size={12} /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => { setSelectedItem(item); setItemModal('delete'); }}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        open={catModal === 'add' || catModal === 'edit'}
        title={catModal === 'add' ? 'เพิ่มหมวดหมู่' : 'แก้ไขหมวดหมู่'}
        onClose={() => setCatModal(null)}
        onConfirm={handleSaveCat}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        <div className="form-group">
          <label className="form-label">ชื่อ (ไทย)</label>
          <input className="form-input" value={catForm.name_th} onChange={e => setCatForm(f => ({ ...f, name_th: e.target.value }))} placeholder="เช่น ทักษะสังคม" />
        </div>
        <div className="form-group">
          <label className="form-label">ชื่อ (อังกฤษ)</label>
          <input className="form-input" value={catForm.name_en} onChange={e => setCatForm(f => ({ ...f, name_en: e.target.value }))} placeholder="e.g. Social Skills" />
        </div>
        <div className="form-group">
          <label className="form-label">ลำดับ</label>
          <input className="form-input" type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
        </div>

        {/* Cohort selector */}
        <div className="form-group">
          <label className="form-label">ผูกกับห้องเรียน</label>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
            ไม่เลือก = ใช้กับทุกห้องเรียน
          </p>
          {cohorts.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>ยังไม่มีห้องเรียนในระบบ</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cohorts.map(c => {
                const checked = catForm.cohort_ids.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCohort(c.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Sarabun, sans-serif',
                      background: checked ? '#1A1A2E' : '#F3F4F6',
                      color: checked ? 'white' : '#6B7280',
                      fontWeight: checked ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                    {c.name} <span style={{ opacity: 0.7, fontSize: 11 }}>({c.level})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={catModal === 'delete'} title="ยืนยันการลบ" onClose={() => setCatModal(null)}
        onConfirm={async () => { setSaving(true); try { await behaviorCategoriesApi.delete(selectedCat!.id); setCatModal(null); load(); } finally { setSaving(false); } }}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ปิดใช้งานหมวดหมู่ <strong>{selectedCat?.name_th}</strong>?</p>
      </Modal>

      {/* Item Modal */}
      <Modal
        open={itemModal === 'add' || itemModal === 'edit'}
        title={itemModal === 'add' ? 'เพิ่มรายการประเมิน' : 'แก้ไขรายการ'}
        onClose={() => setItemModal(null)}
        onConfirm={handleSaveItem}
        confirmLabel={saving ? 'กำลังบันทึก...' : 'บันทึก'}
      >
        <div className="form-group">
          <label className="form-label">ชื่อ (ไทย)</label>
          <input className="form-input" value={itemForm.name_th} onChange={e => setItemForm(f => ({ ...f, name_th: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">ชื่อ (อังกฤษ)</label>
          <input className="form-input" value={itemForm.name_en} onChange={e => setItemForm(f => ({ ...f, name_en: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">คะแนนสูงสุด</label>
            <input className="form-input" type="number" min={1} max={10} value={itemForm.max_score} onChange={e => setItemForm(f => ({ ...f, max_score: parseInt(e.target.value) || 3 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">ลำดับ</label>
            <input className="form-input" type="number" value={itemForm.sort_order} onChange={e => setItemForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </Modal>

      <Modal open={itemModal === 'delete'} title="ยืนยันการลบ" onClose={() => setItemModal(null)}
        onConfirm={async () => { setSaving(true); try { await behaviorItemsApi.delete(selectedItem!.id); setItemModal(null); load(); } finally { setSaving(false); } }}
        confirmLabel={saving ? 'กำลังลบ...' : 'ลบ'} confirmDanger>
        <p style={{ color: '#6B7280' }}>ปิดใช้งานรายการ <strong>{selectedItem?.name_th}</strong>?</p>
      </Modal>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </>
  );
}
