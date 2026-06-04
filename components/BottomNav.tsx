'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav style={{
      position:'fixed',
      bottom:0,
      left:'50%',
      transform:'translateX(-50%)',
      width:'100%',
      maxWidth:480,
      background:'rgba(255, 255, 255, 0.7)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      borderTop:'1px solid rgba(255, 255, 255, 0.3)',
      boxShadow:'0 -8px 32px rgba(0, 0, 0, 0.1)',
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
      zIndex:1000
    }}>
      <div style={{display:'flex',height:64}}>
        <button
          onClick={() => router.push('/')}
          style={{
            flex:1,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:2,
            background:'none',
            border:'none',
            cursor:'pointer',
            transition:'all 0.2s',
            color:pathname==='/'?'#6366f1':'#94a3b8',
            position:'relative'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{fontSize:'0.6rem',fontWeight:pathname==='/'?700:500}}>หน้าแรก</span>
          {pathname==='/' && (
            <div style={{
              position:'absolute',
              top:0,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          )}
        </button>
        <button
          onClick={() => router.push('/summary-behavior')}
          style={{
            flex:1,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:2,
            background:'none',
            border:'none',
            cursor:'pointer',
            transition:'all 0.2s',
            color:pathname==='/summary-behavior'?'#6366f1':'#94a3b8',
            position:'relative'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname==='/summary-behavior'?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span style={{fontSize:'0.6rem',fontWeight:pathname==='/summary-behavior'?700:500}}>อุปนิสัย</span>
          {pathname==='/summary-behavior' && (
            <div style={{
              position:'absolute',
              top:0,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          )}
        </button>
        <button
          onClick={() => router.push('/summary-food-milk')}
          style={{
            flex:1,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:2,
            background:'none',
            border:'none',
            cursor:'pointer',
            transition:'all 0.2s',
            color:pathname==='/summary-food-milk'?'#6366f1':'#94a3b8',
            position:'relative'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          <span style={{fontSize:'0.6rem',fontWeight:pathname==='/summary-food-milk'?700:500}}>อาหาร นม</span>
          {pathname==='/summary-food-milk' && (
            <div style={{
              position:'absolute',
              top:0,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          )}
        </button>
        <button
          onClick={() => router.push('/summary-nap')}
          style={{
            flex:1,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:2,
            background:'none',
            border:'none',
            cursor:'pointer',
            transition:'all 0.2s',
            color:pathname==='/summary-nap'?'#6366f1':'#94a3b8',
            position:'relative'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h1.5M8 6v1.5M18 6v1.5M22 12h-1.5"/>
            <path d="M19 17a7 7 0 1 1-14 0"/>
          </svg>
          <span style={{fontSize:'0.6rem',fontWeight:pathname==='/summary-nap'?700:500}}>การนอน</span>
          {pathname==='/summary-nap' && (
            <div style={{
              position:'absolute',
              top:0,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          )}
        </button>
        <button
          onClick={() => router.push('/summary-excretion')}
          style={{
            flex:1,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:2,
            background:'none',
            border:'none',
            cursor:'pointer',
            transition:'all 0.2s',
            color:pathname==='/summary-excretion'?'#6366f1':'#94a3b8',
            position:'relative'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 11h10M7 15h6"/>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          <span style={{fontSize:'0.6rem',fontWeight:pathname==='/summary-excretion'?700:500}}>ขับถ่าย</span>
          {pathname==='/summary-excretion' && (
            <div style={{
              position:'absolute',
              top:0,
              left:'50%',
              transform:'translateX(-50%)',
              width:30,
              height:3,
              background:'#6366f1',
              borderRadius:'0 0 3px 3px'
            }} />
          )}
        </button>
      </div>
    </nav>
  );
}
