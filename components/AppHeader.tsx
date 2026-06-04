'use client';
import React from 'react';
import { AppUser, Child } from '@/types';

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
  onParentSelect: (id: string | null) => void;
  onChildSelect: (id: string) => void;
}

export default function AppHeader({
  parents,
  children,
  parentId,
  childId,
  childLoading,
  onParentSelect,
  onChildSelect
}: AppHeaderProps) {
  const selectedChild = children.find(c => c.id === childId);

  return (
    <header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>
      <style>{`
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
      `}</style>
      
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>
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
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#ff8787',fontSize:'1.1rem',padding:'0 6px',alignSelf:'center',marginTop:10,flexShrink:0}}>
          <i className="bi bi-heart-fill" style={{color:'#ff8787'}}></i>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden',alignItems:'flex-end'}}>
          <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ลูก / หลาน</span>
          <div className="avatar-row" style={{justifyContent:'flex-end',direction:'rtl'}}>
            {childLoading ? [1,2,3].map(i=><SkCircle key={i} size={42}/>) :
              children.map(c=>(
                <button key={c.id} type="button" onClick={()=>onChildSelect(c.id)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                  <Avatar src={c.photo_url} name={c.name_th} size={42} active={childId===c.id} accentColor="#6366f1" />
                  <div style={{width:4,height:4,borderRadius:'50%',background:childId===c.id?'#6366f1':'transparent',transition:'all .2s'}} />
                </button>
              ))
            }
          </div>
        </div>
      </div>
      <div style={{textAlign:'center',marginTop:4}}>
        <p style={{margin:'0 0 4px',fontSize:'0.78rem',fontWeight:600,color:'#f472b6',transition:'all .2s'}}>
          {parents.find(p=>p.id===parentId)?.display_name ?? '\u00A0'}
        </p>
        {childLoading ? (
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:4}}>
            <SkRow w={160} h={22} /><SkRow w={200} h={14} />
          </div>
        ) : (
          <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#0f172a',letterSpacing:'-0.3px'}}>
            {selectedChild?.name_th ?? 'เลือกบุตรหลาน'}
          </h1>
        )}
      </div>
    </header>
  );
}
