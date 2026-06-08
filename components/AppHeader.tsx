'use client';
import React from 'react';
import { AppUser, Child } from '@/types';

/* ── Icon Components ─────────────────────────────── */
const CalendarIcon = ({size=14,color='#94a3b8'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const shimmer: React.CSSProperties = {
  background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8,
};
const SkRow = ({w='100%',h=14,mb=0}:{w?:string|number;h?:number;mb?:number}) =>
  <div style={{...shimmer,width:w,height:h,marginBottom:mb}} />;
const SkCircle = ({size=40}:{size?:number}) =>
  <div style={{...shimmer,width:size,height:size,borderRadius:'50%',flexShrink:0}} />;

function Avatar({src,name,size=42,active,accentColor='#6366f1'}:{src?:string|null;name?:string|null;size?:number;active?:boolean;accentColor?:string}) {
  const initial = (name ?? '?').slice(0,1).toUpperCase();
  const colors  = ['#E8754A','#6366f1','#4A90B8','#4CAF76','#F5A623','#E85C5C','#ec4899','#34d399'];
  const bg      = colors[(initial.charCodeAt(0))%colors.length];
  return src
    ? <img src={src} alt={name||''} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:'50%',background:active?bg:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:active?'white':'#94a3b8',fontSize:size*0.4,fontWeight:700,border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}}>
        {initial}
      </div>;
}

interface AppHeaderProps {
  parents: AppUser[];
  children: Child[];
  parentId: string | null;
  childId: string | null;
  childLoading: boolean;
  currentUser?: AppUser | null;
  onParentSelect: (id: string | null) => void;
  onChildSelect: (id: string) => void;
  subtitle?: string;
  // Teacher mode
  cohorts?: { id: string; name: string; level: string }[];
  cohortId?: string | null;
  onCohortSelect?: (id: string) => void;
}

export default function AppHeader({
  parents,
  children,
  parentId,
  childId,
  childLoading,
  currentUser,
  onParentSelect,
  onChildSelect,
  subtitle,
  cohorts = [],
  cohortId,
  onCohortSelect
}: AppHeaderProps) {
  const selectedChild = children.find(c => c.id === childId);
  const isTeacher = currentUser?.role === 'teacher';
  const selectedCohort = cohorts.find(c => c.id === cohortId);
  const canSelectCohort = currentUser?.can_select_cohort !== false; // default to true

  return (
    <header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
      <style>{`
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
        .cohort-selector{position:relative;width:100%}
        .cohort-dropdown{display:block;width:100%;padding:12px 40px 12px 16px;border:2px solid #e2e8f0;borderRadius:12px;background:white;fontSize:'0.9rem';fontWeight:600;color:'#1e293b';cursor:pointer;appearance:none;transition:all .2s}
        .cohort-dropdown:hover{borderColor:#cbd5e1}
        .cohort-dropdown:focus{outline:none;borderColor:#6366f1;boxShadow:0 0 0 3px rgba(99,102,241,0.1)}
        .cohort-arrow{position:absolute;right:16px;top:50%;transform:translateY(-50%);pointerEvents:none;color:#94a3b8;fontSize:'1rem'}
      `}</style>
      
      {/* ─── TEACHER MODE: Cohort Selector ─────────────────────────────────────────── */}
      {isTeacher && cohorts.length > 0 && canSelectCohort && (
        <div style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid #f1f5f9'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,display:'block',marginBottom:12}}>เลือกรุ่น / ห้องเรียน</span>
          <div className="cohort-selector">
            <select 
              className="cohort-dropdown"
              value={cohortId || ''}
              onChange={(e) => onCohortSelect?.(e.target.value)}
              style={{display:'block',width:'100%',padding:'12px 40px 12px 16px',border:'2px solid #e2e8f0',borderRadius:12,background:'white',fontSize:'0.9rem',fontWeight:600,color:'#1e293b',cursor:'pointer',appearance:'none',transition:'all .2s'}}
            >
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.level ? `(${c.level})` : ''}
                </option>
              ))}
            </select>
            <i className="bi bi-chevron-down cohort-arrow" style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#94a3b8',fontSize:'1rem'}}></i>
          </div>
        </div>
      )}

      {/* แสดงชื่อห้องถ้าไม่สามารถเลือกได้ */}
      {isTeacher && cohorts.length > 0 && !canSelectCohort && selectedCohort && (
        <div style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid #f1f5f9'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,display:'block',marginBottom:8}}>ห้องเรียน</span>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10}}>
            <span style={{fontSize:'1.2rem'}}>🏫</span>
            <div>
              <div style={{fontSize:'0.95rem',fontWeight:700,color:'#1e293b'}}>{selectedCohort.name}</div>
              {selectedCohort.level && (
                <div style={{fontSize:'0.75rem',color:'#94a3b8'}}>{selectedCohort.level}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ─── TEACHER MODE: Child Selector (always show) ─────────────────────────────── */}
      {isTeacher && (
        <div style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid #f1f5f9'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,display:'block',marginBottom:12}}>เลือกนักเรียน</span>
          <div className="avatar-row">
            {childLoading ? [1,2,3,4].map(i=><SkCircle key={i} size={48}/>) :
              children.length === 0 ? (
                <p style={{fontSize:'0.85rem',color:'#94a3b8',fontStyle:'italic'}}>ไม่มีนักเรียนในรุ่นนี้</p>
              ) :
              children.map(c=>(
                <button key={c.id} type="button" onClick={()=>onChildSelect(c.id)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0}}>
                  <Avatar src={c.photo_url} name={c.name_th} size={48} active={childId===c.id} accentColor="#6366f1" />
                  <span style={{fontSize:'0.7rem',color:childId===c.id?'#1e293b':'#94a3b8',fontWeight:childId===c.id?700:500,transition:'all .2s',maxWidth:60,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {c.nickname_th || c.nickname_en || c.name_th || c.name_en || '?'}
                  </span>
                </button>
              ))
            }
          </div>
        </div>
      )}

      {/* two-way selector (Parent Mode OR Teacher Mode with selected child) */}
      {((!isTeacher) || (isTeacher && childId)) && (
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>
        {/* ฝั่งผู้ปกครอง */}
        <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ผู้ปกครอง</span>
          <div className="avatar-row">
            {childLoading ? [1,2].map(i=><SkCircle key={i} size={42}/>) :
              parents.map(p=>(
                <button key={p.id} type="button" onClick={()=>onParentSelect(parentId===p.id?null:p.id)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0}}>
                  <Avatar src={p.picture_url} name={p.display_name} size={42} active={parentId===p.id} accentColor="#f472b6" />
                  <div style={{width:4,height:4,borderRadius:'50%',background:parentId===p.id?'#f472b6':'transparent',transition:'all .2s'}} />
                </button>
              ))
            }
          </div>
        </div>

        {/* ❤️ connector */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#ff8787',fontSize:'1.1rem',padding:'0 6px',alignSelf:'center',marginTop:10,flexShrink:0}}>
          <i className="bi bi-heart-fill" style={{color:'#ff8787'}}></i>
        </div>

        {/* ฝั่งลูก/นักเรียน */}
        <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden',alignItems:'flex-end'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>
            {isTeacher ? 'นักเรียน' : 'ลูก / หลาน'}
          </span>
          <div className="avatar-row" style={{justifyContent:'flex-end',direction:'rtl'}}>
            {childLoading ? [1,2,3].map(i=><SkCircle key={i} size={42}/>) :
              (isTeacher && childId ? 
                // Teacher mode: แสดงแค่นักเรียนที่เลือก
                children.filter(c => c.id === childId).map(c=>(
                  <button key={c.id} type="button" onClick={()=>onChildSelect(c.id)}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                    <Avatar src={c.photo_url} name={c.name_th} size={42} active={true} accentColor="#6366f1" />
                    <div style={{width:4,height:4,borderRadius:'50%',background:'#6366f1',transition:'all .2s'}} />
                  </button>
                ))
                :
                // Parent mode: แสดงลูกทั้งหมด
                children.map(c=>(
                  <button key={c.id} type="button" onClick={()=>onChildSelect(c.id)}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                    <Avatar src={c.photo_url} name={c.name_th} size={42} active={childId===c.id} accentColor="#6366f1" />
                    <div style={{width:4,height:4,borderRadius:'50%',background:childId===c.id?'#6366f1':'transparent',transition:'all .2s'}} />
                  </button>
                ))
              )
            }
          </div>
        </div>
      </div>
      )}

      {/* title zone — center */}
      <div style={{textAlign:'center',marginTop:4}}>
        {/* แสดงชื่อผู้ปกครองเมื่อมีการเลือก (ทั้ง parent และ teacher mode) */}
        {((!isTeacher) || (isTeacher && childId)) && (
          <p style={{margin:'0 0 4px',fontSize:'0.78rem',fontWeight:600,color:'#f472b6',transition:'all .2s'}}>
            {parents.find(p=>p.id===parentId)?.display_name ?? '\u00A0'}
          </p>
        )}
        {childLoading ? (
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:4}}>
            <SkRow w={160} h={22} /><SkRow w={200} h={14} />
          </div>
        ) : (
          <>
            <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#0f172a',letterSpacing:'-0.3px'}}>
              {
                selectedChild
                  ? (
                      selectedChild.nickname_th ||
                      selectedChild.nickname_en ||
                      selectedChild.name_th ||
                      selectedChild.name_en ||
                      '?'
                    )
                  : (
                      isTeacher
                        ? 'เลือกนักเรียน'
                        : 'เลือกบุตรหลาน'
                    )
              }
            </h1>
            {subtitle && selectedChild && (
              <p style={{margin:'10px 0 0',fontSize:'0.75rem',color:'#94a3b8',fontWeight:500,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <CalendarIcon size={14} color="#94a3b8" />
                <span>{subtitle}</span>
              </p>
            )}
          </>
        )}
      </div>
    </header>
  );
}
