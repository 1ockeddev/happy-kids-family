'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/lib/useLiff';
import { AppUser, Child } from '@/types';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const liff = useLiff();
  const router = useRouter();
  const [parents, setParents] = useState<AppUser[]>([]);
  const [children_list, setChildrenList] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId, setChildId] = useState<string|null>(null);
  const [childLoading, setChildLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── LIFF ready ── */
  useEffect(() => {
    if (!liff.ready) return;
    if (!liff.profile?.userId) {
      fetch('/api/report/children').then(r=>r.json()).then(j=>{
        setChildrenList(j.data??[]);
      });
      return;
    }
    setChildLoading(true);
    fetch('/api/auth/line-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line_user_id:liff.profile.userId,display_name:liff.profile.displayName,picture_url:liff.profile.pictureUrl??null})})
    .then(r=>r.json())
    .then(async regJson => {
      if (regJson.status === 403) {
        setNotRegistered(true);
        return;
      }
      const user = regJson.data;
      if (user?.role === 'teacher') {
        router.replace('/admin/users');
        return;
      }
      const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
      const childJson = await childRes.json();
      const kids:Child[] = childJson.data??[];
      setChildrenList(kids);
      if (kids.length===0) setNotRegistered(true);
    })
    .catch(()=>setNotRegistered(true))
    .finally(()=>setChildLoading(false));
  },[liff.ready,liff.profile?.userId, router]);

  useEffect(()=>{
    if (children_list.length > 0 && !childId) {
      setChildId(children_list[0].id);
    }
  },[children_list, childId]);

  /* ── child → parents ── */
  useEffect(()=>{
    if (!childId) { setParents([]); setParentId(null); return; }
    setParentId(null);
    let cancelled = false;
    fetch(`/api/report/child-parents?child_id=${childId}`).then(r=>r.json())
      .then(j=>{
        if (!cancelled) setParents(j.data??[]);
      });
    return () => { cancelled = true; };
  },[childId]);

  const handleCopy = () => {
    const lineId = liff.profile?.userId || '';
    navigator.clipboard.writeText(lineId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!liff.ready) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'#f8fafc'}}>
      <div style={{width:40,height:40,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  if (notRegistered&&!childLoading) {
    const lineId = liff.profile?.userId || 'ไม่พบ LINE ID';
    
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f8fafc'}}>
        <div style={{background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:340,border:'1px solid #e2e8f0',boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
          <p style={{fontSize:48,marginBottom:12}}>🏫</p>
          <h2 style={{fontWeight:800,color:'#0f172a',marginBottom:8}}>ยังไม่มีข้อมูล</h2>
          <p style={{fontSize:14,color:'#64748b',lineHeight:1.6,marginBottom:20}}>
            LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน<br/>
            กรุณาแจ้ง LINE ID ให้ครูเบียร์
          </p>
          
          <div style={{background:'#f8fafc',borderRadius:12,padding:'16px',marginBottom:16,border:'1px solid #e2e8f0'}}>
            <p style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>LINE ID ของคุณ</p>
            <p style={{fontSize:'0.85rem',color:'#1e293b',fontWeight:600,wordBreak:'break-all',fontFamily:'monospace',marginBottom:12}}>{lineId}</p>
            <button
              onClick={handleCopy}
              style={{
                width:'100%',
                padding:'10px 16px',
                background: copied ? '#10b981' : '#6366f1',
                color:'white',
                border:'none',
                borderRadius:8,
                fontSize:'0.85rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.2s',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:6,
                fontFamily:'Sarabun, sans-serif'
              }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  คัดลอก LINE ID
                </>
              )}
            </button>
          </div>
          
          <p style={{fontSize:'0.75rem',color:'#94a3b8',lineHeight:1.5}}>
            📱 กดปุ่มด้านบนเพื่อคัดลอก LINE ID<br/>
            แล้วส่งให้ครูเบียร์เพื่อเชื่อมโยงบัญชี
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'#f8fafc',minHeight:'100dvh',display:'flex',justifyContent:'center'}}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .avatar-row{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
        .avatar-row::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{width:'100%',maxWidth:480,background:'white',minHeight:'100dvh',paddingBottom:'calc(88px + env(safe-area-inset-bottom,0px))'}}>
        <AppHeader
          parents={parents}
          children={children_list}
          parentId={parentId}
          childId={childId}
          childLoading={childLoading}
          onParentSelect={setParentId}
          onChildSelect={setChildId}
        />
        
        {React.cloneElement(children as React.ReactElement, { childId, parents, parentId })}
        
        {!childLoading && childId && <BottomNav />}
      </div>
    </div>
  );
}
