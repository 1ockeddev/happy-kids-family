'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { Child, DailyReport, Attendance, MilkStatus, ExcretionType, ExcretionAction, AppUser } from '@/types';

/* ── label maps ─────────────────────────────── */
const amtL: Record<MilkStatus,string> = { all:'ทานหมด', some:'ทานครึ่งเดียว', not_must:'ไม่จำเป็น', skip:'ไม่ทาน' };
const amtStyle: Record<MilkStatus,{bg:string;color:string}> = {
  all:      {bg:'#dcfce7',color:'#15803d'},
  some:     {bg:'#fef3c7',color:'#b45309'},
  not_must: {bg:'#dbeafe',color:'#1e40af'},
  skip:     {bg:'#ffe4e6',color:'#9f1239'},
};
const attL:  Record<string,string> = { present:'😊 มาเรียน', absent:'😴 ขาดเรียน', sick:'🤒 ป่วย', leave:'📝 ลา' };
const attC:  Record<string,string> = { present:'#10b981', absent:'#ef4444', sick:'#f59e0b', leave:'#3b82f6' };
const attBg: Record<string,string> = { present:'#ecfdf5', absent:'#fef2f2', sick:'#fffbeb', leave:'#eff6ff' };

interface BehaviorScore {
  item_id:string; name_th:string; name_en:string; score:number; max_score:number;
  category_id:string; category_name_th:string;
  note?:string;
}
interface DayEntry { date:string; daily_id:string; report_id:string|null }

const parseDate = (d?:string|null) => {
  if (!d) return null;
  const s = d.slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s+'T00:00:00') : null;
};
const thDate = (d?:string|null) =>
  parseDate(d)?.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) ?? '';

/* ── shimmer ──────────────────────────────── */
const shimmer: React.CSSProperties = {
  background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8,
};
const SkRow = ({w='100%',h=14,mb=0}:{w?:string|number;h?:number;mb?:number}) =>
  <div style={{...shimmer,width:w,height:h,marginBottom:mb}} />;
const SkCircle = ({size=40}:{size?:number}) =>
  <div style={{...shimmer,width:size,height:size,borderRadius:'50%',flexShrink:0}} />;

/* ── face icons ─────────────────────────────*/
const FaceHappy = ({size=22,color='#10b981'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <path d="M28 38 Q34 28 40 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M60 38 Q66 28 72 38" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 58 Q50 82 72 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceSmile = ({size=22,color='#3b82f6'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/><circle cx="65" cy="38" r="4" fill={color}/>
    <path d="M35 58 Q50 72 65 58" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);
const FaceNeutral = ({size=22,color='#f59e0b'}:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="4"/>
    <circle cx="35" cy="38" r="4" fill={color}/><circle cx="65" cy="38" r="4" fill={color}/>
    <line x1="35" y1="62" x2="65" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

/* ── StatusPill ─────────────────────────────*/
const Pill = ({status}:{status:MilkStatus}) => (
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:6,fontSize:'0.65rem',fontWeight:700,alignSelf:'flex-start',...amtStyle[status]}}>
    {amtL[status]}
  </span>
);

/* ── Avatar ─────────────────────────────────*/
function Avatar({src,name,size=42,active,accentColor='#6366f1'}:{src?:string|null;name?:string|null;size?:number;active?:boolean;accentColor?:string}) {
  const initial = (name ?? '?').slice(0,1).toUpperCase();
  const colors  = ['#E8754A','#6366f1','#4A90B8','#4CAF76','#F5A623','#E85C5C','#ec4899','#34d399'];
  const bg      = colors[(initial.charCodeAt(0))%colors.length];
  return src
    ? <img src={src} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:'50%',background:active?bg:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:active?'white':'#94a3b8',fontSize:size*0.4,fontWeight:700,border:`2px solid ${active?accentColor:'#e2e8f0'}`,opacity:active?1:0.35,transition:'all .2s',flexShrink:0}}>
        {initial}
      </div>;
}

/* ─────────────────────────────────────────── */
export default function LiffPage() {
  const liff = useLiff();
  const router = useRouter();

  const [parents,  setParents]  = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId,  setChildId]  = useState<string|null>(null);

  const [dayEntries,  setDayEntries]  = useState<DayEntry[]>([]);
  const [dayIdx,      setDayIdx]      = useState(0);
  const [report,      setReport]      = useState<DailyReport|null>(null);
  const [attendance,  setAttendance]  = useState<Attendance|null>(null);
  const [scores,      setScores]      = useState<BehaviorScore[]>([]);
  const [teacher,     setTeacher]     = useState<AppUser|null>(null);

  const [childLoading,  setChildLoading]  = useState(false);
  const [daysLoading,   setDaysLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  /* ── LIFF ready ── */
  useEffect(() => {
    if (!liff.ready) return;
    if (!liff.profile?.userId) {
      fetch('/api/report/children').then(r=>r.json()).then(j=>{
        setChildren(j.data??[]);
        if ((j.data??[]).length>0) setChildId((j.data??[])[0].id);
      });
      fetch('/api/users?role=parent').then(r=>r.json()).then(j=>setParents(j.data??[]));
      return;
    }
    setChildLoading(true);
    fetch('/api/auth/line-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line_user_id:liff.profile.userId,display_name:liff.profile.displayName,picture_url:liff.profile.pictureUrl??null})})
    .then(r=>r.json())
    .then(async regJson => {
      if (regJson.status === 403) {
        setNotRegistered(true);  // แสดงหน้า "ติดต่อครู"
        return;
      }
      const user = regJson.data;
      // ถ้าเป็น teacher → redirect ไป admin/users
      if (user?.role === 'teacher') {
        router.replace('/admin/users');
        return;
      }
      // parent → โหลดลูก
      const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
      const childJson = await childRes.json();
      const kids:Child[] = childJson.data??[];
      setChildren(kids);
      if (kids.length===0) setNotRegistered(true);
      if (kids.length===1) setChildId(kids[0].id);
      fetch('/api/users?role=parent').then(r=>r.json()).then(j2=>setParents(j2.data??[]));
    })
    .catch(()=>setNotRegistered(true))
    .finally(()=>setChildLoading(false));
  },[liff.ready,liff.profile?.userId]);

  /* ── child → days ── */
  useEffect(()=>{
    if (!childId) return;
    setDaysLoading(true);
    setDayEntries([]); setDayIdx(0); setReport(null); setAttendance(null); setScores([]);
    fetch(`/api/report/dates?child_id=${childId}`).then(r=>r.json())
      .then(j=>setDayEntries(j.data??[]))
      .finally(()=>setDaysLoading(false));
  },[childId]);

  /* ── day → report ── */
  useEffect(()=>{
    const entry = dayEntries[dayIdx];
    if (!entry||!childId){setReport(null);setAttendance(null);setScores([]);return;}
    setReportLoading(true);
    Promise.all([
      entry.report_id ? fetch(`/api/daily-reports/${entry.report_id}`).then(r=>r.json()) : Promise.resolve({data:null}),
      fetch(`/api/attendance?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
      fetch(`/api/behavior-scores?daily_id=${entry.daily_id}&child_id=${childId}`).then(r=>r.json()),
    ]).then(([rj,aj,bj])=>{
      const rep = rj.data??null;
      setReport(rep); setAttendance((aj.data??[])[0]??null); setScores(bj.data??[]);
      // load teacher
      if (rep?.created_by) fetch(`/api/users/${rep.created_by}`).then(r=>r.json()).then(j=>setTeacher(j.data??null)).catch(()=>{});
      else setTeacher(null);
    }).finally(()=>setReportLoading(false));
  },[dayIdx,dayEntries,childId]);

  const selectedChild  = children.find(c=>c.id===childId);
  const currentEntry   = dayEntries[dayIdx];
  const behaviorGroups = scores.reduce<Record<string,{name_th:string;items:BehaviorScore[]}>>((acc,s)=>{
    if (!acc[s.category_id]) acc[s.category_id]={name_th:s.category_name_th,items:[]};
    acc[s.category_id].items.push(s); return acc;
  },{});
  const exDiaper = report?.excretions?.filter(e=>e.action==='diaper')??[];
  const exPotty  = report?.excretions?.filter(e=>e.action==='potty')??[];

  /* ── loading ── */
  if (!liff.ready) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notRegistered&&!childLoading) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f8fafc'}}>
      <div style={{background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:300,border:'1px solid #e2e8f0'}}>
        <p style={{fontSize:48,marginBottom:12}}>🏫</p>
        <h2 style={{fontWeight:800,color:'#0f172a',marginBottom:8}}>ยังไม่มีข้อมูล</h2>
        <p style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน<br/>กรุณาติดต่อคุณครูเพื่อลงทะเบียน</p>
      </div>
    </div>
  );

  return (
    <div style={{background:'#f8fafc',minHeight:'100dvh',display:'flex',justifyContent:'center'}}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade{animation:fadeIn .25s ease}
        *{box-sizing:border-box}
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{width:'100%',maxWidth:480,background:'white',minHeight:'100dvh',paddingBottom:'calc(24px + env(safe-area-inset-bottom,0px))'}}>

        {/* ─── HEADER ─────────────────────────────── */}
        <header style={{padding:'30px 24px 20px',background:'white',borderBottom:'1px solid #f1f5f9'}}>

          {/* two-way selector */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>

            {/* ฝั่งผู้ปกครอง */}
            <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ผู้ปกครอง</span>
              <div className="avatar-row">
                {childLoading ? [1,2].map(i=><SkCircle key={i} size={42}/>) :
                  parents.map(p=>(
                    <button key={p.id} type="button" onClick={()=>setParentId(parentId===p.id?null:p.id)}
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
              ❤️
            </div>

            {/* ฝั่งลูก */}
            <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'hidden',alignItems:'flex-end'}}>
              <span style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:1,color:'#94a3b8',fontWeight:800,whiteSpace:'nowrap'}}>ลูก / หลาน</span>
              <div className="avatar-row" style={{justifyContent:'flex-end',direction:'rtl'}}>
                {childLoading ? [1,2,3].map(i=><SkCircle key={i} size={42}/>) :
                  children.map(c=>(
                    <button key={c.id} type="button" onClick={()=>setChildId(c.id)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,direction:'ltr'}}>
                      <Avatar src={c.photo_url} name={c.name_th} size={42} active={childId===c.id} accentColor="#6366f1" />
                      <div style={{width:4,height:4,borderRadius:'50%',background:childId===c.id?'#6366f1':'transparent',transition:'all .2s'}} />
                    </button>
                  ))
                }
              </div>
            </div>
          </div>

          {/* title zone — center */}
          <div style={{textAlign:'center',marginTop:4}}>
              <p style={{margin:'0 0 4px',fontSize:'0.78rem',fontWeight:600,color:'#f472b6',transition:'all .2s'}}>
                {parents.find(p=>p.id===parentId)?.display_name ?? '\u00A0'}
              </p>
            {childLoading ? (
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:4}}>
                <SkRow w={160} h={22} /><SkRow w={200} h={14} />
              </div>
            ) : (
              <>
                <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#0f172a',letterSpacing:'-0.3px'}}>
                  {selectedChild?.name_th ?? 'เลือกบุตรหลาน'}
                </h1>
                <p style={{margin:'4px 0 0',fontSize:'0.75rem',color:'#64748b',fontWeight:500}}>
                  {currentEntry ? thDate(currentEntry.date) : 'กรุณาเลือกบุตรหลาน'}
                </p>
              </>
            )}
          </div>
        </header>

        {/* ─── DATE STRIP ─────────────────────────── */}
        {!childLoading && dayEntries.length > 0 && (
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none'}}>
            {dayEntries.map((e,i)=>{
              const dt = parseDate(e.date);
              const sel = dayIdx===i;
              return (
                <button key={e.daily_id} onClick={()=>setDayIdx(i)}
                  style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 10px',borderRadius:12,border:'none',cursor:'pointer',minWidth:50,background:sel?'#6366f1':'#f8fafc',color:sel?'white':'#475569',transition:'all .15s'}}>
                  <span style={{fontSize:10,fontWeight:600,opacity:0.7}}>{dt?.toLocaleDateString('th-TH',{weekday:'short'})}</span>
                  <span style={{fontSize:17,fontWeight:800}}>{dt?.getDate()}</span>
                  <span style={{fontSize:10,opacity:0.7}}>{dt?.toLocaleDateString('th-TH',{month:'short'})}</span>
                </button>
              );
            })}
          </div>
        )}
        {daysLoading && <div style={{padding:'12px 16px',display:'flex',gap:6}}>{[1,2,3,4,5].map(i=><div key={i} style={{...shimmer,width:50,height:62,borderRadius:12,flexShrink:0}} />)}</div>}

        {/* ─── CONTENT ────────────────────────────── */}
        <div style={{padding:'16px 16px 0'}}>

          {reportLoading && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{...shimmer,height:70,borderRadius:16}} />
              <div style={{...shimmer,height:180,borderRadius:16}} />
              <div style={{...shimmer,height:140,borderRadius:16}} />
            </div>
          )}

          {!reportLoading && childId && (
            <div className="fade">

              {/* Attendance */}
              {attendance && (
                <div style={{background:attBg[attendance.status],borderRadius:16,padding:'14px 18px',marginBottom:14,display:'flex',alignItems:'center',gap:12,border:`1px solid ${attC[attendance.status]}22`}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {attendance.status==='present'?'😊':attendance.status==='sick'?'🤒':attendance.status==='absent'?'😴':'📝'}
                  </div>
                  <div>
                    <p style={{fontSize:10,color:attC[attendance.status],fontWeight:800,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>สถานะวันนี้</p>
                    <p style={{fontSize:17,fontWeight:800,color:attC[attendance.status],margin:0}}>{attL[attendance.status]}</p>
                    {attendance.note&&<p style={{fontSize:12,color:'#475569',marginTop:3}}>{attendance.note}</p>}
                  </div>
                </div>
              )}

              {!report && !attendance && dayEntries.length>0 && (
                <div style={{background:'white',borderRadius:16,padding:'32px',textAlign:'center',border:'1px solid #e2e8f0',marginBottom:14}}>
                  <p style={{fontSize:32,marginBottom:8}}>📋</p>
                  <p style={{color:'#94a3b8',fontSize:14}}>ยังไม่มีรายงานสำหรับวันนี้</p>
                </div>
              )}

              {report && (<>

                {/* Activity */}
                {report.daily?.activity && (
                  <div style={{background:'white',borderRadius:16,padding:'20px',marginBottom:14,border:'1px solid #e2e8f0',textAlign:'center'}}>
                    <span style={{fontSize:'0.7rem',fontWeight:800,color:'#6366f1',textTransform:'uppercase',letterSpacing:1.5,display:'block',marginBottom:6}}>TODAY&apos;S ACTIVITY</span>
                    <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'#0f172a',margin:0,letterSpacing:'-0.2px'}}>{report.daily.activity}</h2>
                  </div>
                )}

                {/* Food & Milk */}
                <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155'}}>
                    <span style={{marginRight:8,fontSize:'1.1rem'}}>🥣</span> อาหารและโภชนาการ
                  </div>

                  {(report.daily?.food||report.daily?.fruit)&&(
                    <div className="food-grid">
                      {report.daily?.food&&(
                        <div className={`food-item`}>
                          <div>
                            <span className="food-label">มื้อกลางวัน</span>
                            <span className="food-name">{report.daily.food}</span>
                          </div>
                          {report.food_amount&&(
                            <span className={`status-pill status-${report.food_amount.replace('_','-')}`}>{amtL[report.food_amount]}</span>
                          )}
                          {report.food_note&&<div className="food-note">💬 {report.food_note}</div>}
                        </div>
                      )}
                      {report.daily?.fruit&&(
                        <div className={`food-item`}>
                          <div>
                            <span className="food-label">ผลไม้</span>
                            <span className="food-name">{report.daily.fruit}</span>
                          </div>
                          {report.fruit_amount&&(
                            <span className={`status-pill status-${report.fruit_amount.replace('_','-')}`}>{amtL[report.fruit_amount]}</span>
                          )}
                          {report.fruit_note&&<div className="food-note">💬 {report.fruit_note}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {(report.milk1!=='skip'||report.milk2!=='skip')&&(
                    <div className="milk-section">
                      <h3 className="milk-section-title">🥛 การดื่มนมประจำวัน</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {[{label:'กล่องที่ 1 (เช้า)',val:report.milk1,note:report.milk1_note},{label:'กล่องที่ 2 (บ่าย)',val:report.milk2,note:report.milk2_note}]
                          .filter(m=>m.val!=='skip')
                          .map(m=>(
                            <div key={m.label} className={`milk-box amt-${m.val.replace('_','-')}`}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,width:'100%'}}>
                                <span className="milk-box-label">{m.label}</span>
                                <span className="milk-tag">{amtL[m.val]}</span>
                              </div>
                              {m.note&&<div className="milk-note">{m.note}</div>}
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Behaviors */}
                {scores.length>0&&(
                  <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:16,color:'#334155'}}>
                      <span style={{marginRight:8,fontSize:'1.1rem'}}>✨</span> อุปนิสัยวันนี้
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      {Object.values(behaviorGroups).map(g=>{
                        const excellent = g.items.filter(s=>s.score>=s.max_score);
                        const good      = g.items.filter(s=>s.score>0&&s.score<s.max_score);
                        const improve   = g.items.filter(s=>s.score===0);
                        return (
                          <div key={g.name_th}>
                            <p style={{fontSize:'0.78rem',fontWeight:800,color:'#7c3aed',marginBottom:10}}>{g.name_th}</p>
                            {[
                              {items:excellent, face:<FaceHappy />, label:'ทำได้ดีเยี่ยม', color:'#10b981', tagBg:'#f0fdf4', tagBorder:'#bbf7d0', tagColor:'#166534'},
                              {items:good,      face:<FaceSmile />, label:'ทำได้ดี',       color:'#3b82f6', tagBg:'#eff6ff', tagBorder:'#bfdbfe', tagColor:'#1e40af'},
                              {items:improve,   face:<FaceNeutral />, label:'ควรส่งเสริม', color:'#f59e0b', tagBg:'#fffbeb', tagBorder:'#fde68a', tagColor:'#92400e'},
                            ].filter(gr=>gr.items.length>0).map(gr=>(
                              <div key={gr.label} style={{marginBottom:10}}>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,color:gr.color}}>
                                  {gr.face}
                                  <span style={{fontWeight:700,fontSize:'0.9rem'}}>{gr.label}</span>
                                </div>
                                {/* habit-stack: inline tags + full-width tags with notes */}
                                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                                  {gr.items.map(s=>{
                                    const hasNote = !!s.note;
                                    return hasNote ? (
                                      <div key={s.item_id} style={{width:'100%',display:'flex',flexDirection:'column',padding:'10px 12px',borderRadius:12,border:`1px solid ${gr.tagBorder}`,background:gr.tagBg}}>
                                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',gap:8}}>
                                          <span style={{fontSize:'0.85rem',fontWeight:700,color:gr.tagColor}}>{s.name_th}</span>
                                          <span style={{fontSize:'0.72rem',color:gr.tagColor,opacity:0.7}}>✓</span>
                                        </div>
                                        <div style={{marginTop:6,fontSize:'0.75rem',color:'#64748b',lineHeight:1.4}}>{s.note}</div>
                                      </div>
                                    ) : (
                                      <div key={s.item_id} style={{display:'flex',alignItems:'center',padding:'6px 12px',borderRadius:20,border:`1px solid ${gr.tagBorder}`,background:gr.tagBg}}>
                                        <span style={{fontSize:'0.85rem',fontWeight:700,color:gr.tagColor}}>{s.name_th}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nap */}
                <div style={{background:'white',borderRadius:16,padding:'20px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',color:'#4338ca',gap:8}}>
                      <span>😴</span> การนอนกลางวัน
                    </div>
                    {report.nap_from&&report.nap_to&&(
                      <div style={{textAlign:'right'}}>
                        <span style={{display:'block',fontSize:'1.05rem',fontWeight:800,color:'#1e1b4b'}}>
                          {(()=>{const d=(new Date('2000-01-01T'+report.nap_to).getTime()-new Date('2000-01-01T'+report.nap_from).getTime())/60000;return `${Math.floor(d/60)} ชม. ${d%60} นาที`;})()}
                        </span>
                        <span style={{fontSize:'0.75rem',color:'#818cf8',fontWeight:700}}>
                          {report.nap_from.slice(0,5)} - {report.nap_to.slice(0,5)} น.
                        </span>
                      </div>
                    )}
                  </div>
                  {report.nap_from&&report.nap_to ? (()=>{
                    const toMin=(t:string)=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
                    const start=9*60,end=15*60,total=end-start;
                    const ns=toMin(report.nap_from),ne=toMin(report.nap_to);
                    const left=((ns-start)/total)*100, width=((ne-ns)/total)*100;
                    return (
                      <div style={{position:'relative',paddingTop:16}}>
                        <div style={{position:'absolute',top:0,width:'100%',fontSize:'0.65rem',color:'#94a3b8',fontWeight:700}}>
                          <span style={{position:'absolute',left:0}}>09:00</span>
                          <span style={{position:'absolute',left:'50%',transform:'translateX(-50%)'}}>12:00</span>
                          <span style={{position:'absolute',right:0}}>15:00</span>
                        </div>
                        <div style={{width:'100%',height:10,background:'#f1f5f9',borderRadius:5,overflow:'hidden',margin:'6px 0'}}>
                          <div style={{position:'relative',height:'100%'}}>
                            <div style={{position:'absolute',left:`${left}%`,width:`${width}%`,height:'100%',background:'#818cf8',borderRadius:5}} />
                          </div>
                        </div>
                        <div style={{position:'relative',height:14,fontSize:'0.65rem',fontWeight:700,color:'#4338ca'}}>
                          <span style={{position:'absolute',left:`${left}%`,transform:'translateX(-50%)'}}>{report.nap_from.slice(0,5)}</span>
                          <span style={{position:'absolute',left:`${left+width}%`,transform:'translateX(-50%)'}}>{report.nap_to.slice(0,5)}</span>
                        </div>
                      </div>
                    );
                  })() : <p style={{color:'#94a3b8',fontSize:14}}>ไม่ได้นอนกลางวัน</p>}
                </div>

                {/* Excretions */}
                {(exDiaper.length>0||exPotty.length>0)&&(
                  <div style={{background:'white',borderRadius:16,padding:'18px',marginBottom:14,border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex',alignItems:'center',fontWeight:700,fontSize:'1rem',marginBottom:14,color:'#334155'}}>
                      <span style={{marginRight:8}}>🚽</span> การขับถ่าย
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {exDiaper.length>0&&(
                        <div style={{background:'#fff7ed',padding:14,borderRadius:14,border:'1px solid #ffedd5'}}>
                          <p style={{fontSize:'0.85rem',fontWeight:800,color:'#c2410c',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            👶 ผ้าอ้อม (Diapers)
                          </p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[{label:'ฉี่ (Wet)',items:exDiaper.filter(e=>e.type==='pee')},{label:'อึ (Soiled)',items:exDiaper.filter(e=>e.type==='poo')}]
                              .filter(g=>g.items.length>0)
                              .map(g=>(
                                <div key={g.label} style={{background:'white',padding:8,borderRadius:10,textAlign:'center'}}>
                                  <span style={{display:'block',fontSize:'0.7rem',color:'#9a3412'}}>{g.label}</span>
                                  <span style={{fontWeight:700,color:'#4a5568'}}>{g.items.length} ครั้ง</span>
                                  <small style={{display:'block',fontSize:'0.65rem',color:'#94a3b8'}}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {exPotty.length>0&&(
                        <div style={{background:'#f0fdf4',padding:14,borderRadius:14,border:'1px solid #dcfce7'}}>
                          <p style={{fontSize:'0.85rem',fontWeight:800,color:'#15803d',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                            🚽 นั่งกระโถน (Potty)
                          </p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[{label:'ฉี่ (Pee)',items:exPotty.filter(e=>e.type==='pee')},{label:'อึ (Poo)',items:exPotty.filter(e=>e.type==='poo')}]
                              .filter(g=>g.items.length>0)
                              .map(g=>(
                                <div key={g.label} style={{background:'white',padding:8,borderRadius:10,textAlign:'center'}}>
                                  <span style={{display:'block',fontSize:'0.7rem',color:'#166534'}}>{g.label}</span>
                                  <span style={{fontWeight:700,color:'#4a5568'}}>{g.items.length} ครั้ง</span>
                                  <small style={{display:'block',fontSize:'0.65rem',color:'#94a3b8'}}>{g.items.map(e=>e.time?.slice(0,5)).filter(Boolean).join(', ')||'-'}</small>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher note */}
                {report.note&&(
                  <div style={{background:'#eff6ff',borderRadius:16,padding:'16px 18px',marginBottom:14,border:'1px solid #dbeafe'}}>
                    <p style={{fontSize:'0.7rem',fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>💬 ข้อความจากครู</p>
                    <p style={{fontSize:'0.95rem',color:'#1e293b',lineHeight:1.7,margin:0}}>{report.note}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{textAlign:'center',marginTop:24,paddingTop:16,borderTop:'1px solid #f1f5f9'}}>
                  <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'0.8rem'}}>บันทึกโดยคุณครู</p>
                  <p style={{margin:'2px 0',color:'#475569',fontWeight:600,fontSize:'0.88rem'}}>
                    {teacher?.display_name ?? 'KinderCare'}
                  </p>
                  {currentEntry&&<p style={{marginTop:8,fontSize:'0.72rem',color:'#94a3b8'}}>{thDate(currentEntry.date)}</p>}
                </div>
              </>)}

            </div>
          )}

          {!childId&&!childLoading&&(
            <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8'}}>
              <p style={{fontSize:44,marginBottom:10}}>👆</p>
              <p style={{fontSize:'0.95rem'}}>เลือกบุตรหลานเพื่อดูรายงาน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
