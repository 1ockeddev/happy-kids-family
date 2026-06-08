'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiff } from '@/lib/useLiff';
import { Child, AppUser } from '@/types';

interface UserAppContextType {
  // User & Auth
  currentUser: AppUser | null;
  liffReady: boolean;
  notRegistered: boolean;
  
  // Children & Parents
  children: Child[];
  allChildren: Child[]; // All children (unfiltered)
  parents: AppUser[];
  childId: string | null;
  parentId: string | null;
  childLoading: boolean;
  
  // Cohort (for teacher mode)
  cohorts: { id: string; name: string; level: string }[];
  cohortId: string | null;
  setCohortId: (id: string | null) => void;
  
  // Enrollment
  enrollmentPeriod: { start: string; end: string | null } | null;
  
  // Actions
  setChildId: (id: string) => void;
  setParentId: (id: string | null) => void;
}

const UserAppContext = createContext<UserAppContextType | undefined>(undefined);

export function UserAppProvider({ children: reactChildren }: { children: ReactNode }) {
  const liff = useLiff();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [parents, setParents] = useState<AppUser[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]); // Store all children
  const [children, setChildren] = useState<Child[]>([]); // Filtered children
  const [cohorts, setCohorts] = useState<{ id: string; name: string; level: string }[]>([]);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [childLoading, setChildLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<{ start: string; end: string | null } | null>(null);
  const hasInitialized = React.useRef(false);

  /* ── LIFF ready ── */
  useEffect(() => {
    if (!liff.ready) return;
    
    if (!liff.profile?.userId) {
      // Development mode
      const mockRole = localStorage.getItem('mockRole') as 'teacher' | 'parent' | null;
      
      if (mockRole === 'teacher') {
        const mockUser: AppUser = {
          id: 'dev-teacher-id',
          line_user_id: null,
          role: 'teacher',
          status: 'active',
          display_name: 'Dev Teacher',
          line_display_name: null,
          picture_url: null,
          created_at: new Date().toISOString()
        };
        setCurrentUser(mockUser);
        
        // Load cohorts for teacher
        fetch('/api/cohorts').then(r => r.json()).then(j => {
          const cohortList = (j.data ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            level: c.level
          }));
          setCohorts(cohortList);
          
          // Auto-select first cohort or restore from localStorage
          const savedCohortId = localStorage.getItem('selectedCohortId');
          if (savedCohortId && cohortList.find((c: any) => c.id === savedCohortId)) {
            setCohortId(savedCohortId);
          } else if (cohortList.length > 0) {
            setCohortId(cohortList[0].id);
          }
        });
        
        fetch('/api/children').then(r => r.json()).then(j => {
          setAllChildren(j.data ?? []);
        });
      } else {
        fetch('/api/report/children').then(r => r.json()).then(j => {
          const kids = j.data ?? [];
          setAllChildren(kids);
          setChildren(kids);
        });
      }
      return;
    }
    
    setChildLoading(true);
    fetch('/api/auth/line-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_user_id: liff.profile.userId,
        display_name: liff.profile.displayName,
        picture_url: liff.profile.pictureUrl ?? null
      })
    })
      .then(r => r.json())
      .then(async regJson => {
        if (regJson.status === 403) {
          setNotRegistered(true);
          return;
        }
        const user = regJson.data;
        setCurrentUser(user);
        
        if (user?.role === 'teacher') {
          // Load cohorts
          const cohortRes = await fetch('/api/cohorts');
          const cohortJson = await cohortRes.json();
          const cohortList = (cohortJson.data ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            level: c.level
          }));
          setCohorts(cohortList);
          
          // ถ้า admin ตั้งค่าให้ไม่สามารถเลือก cohort ได้ ให้ใช้ default_cohort_id
          if (user.can_select_cohort === false && user.default_cohort_id) {
            setCohortId(user.default_cohort_id);
          } else {
            // Auto-select first cohort or restore from localStorage
            const savedCohortId = localStorage.getItem('selectedCohortId');
            
            // ถ้ามี default_cohort_id ให้ใช้เป็น fallback
            const defaultId = user.default_cohort_id;
            
            if (savedCohortId && cohortList.find((c: any) => c.id === savedCohortId)) {
              setCohortId(savedCohortId);
            } else if (defaultId && cohortList.find((c: any) => c.id === defaultId)) {
              setCohortId(defaultId);
            } else if (cohortList.length > 0) {
              setCohortId(cohortList[0].id);
            }
          }
          
          // Load all children
          const childRes = await fetch('/api/children');
          const childJson = await childRes.json();
          setAllChildren(childJson.data ?? []);
        } else {
          const childRes = await fetch(`/api/report/line-children?line_user_id=${liff.profile!.userId}`);
          const childJson = await childRes.json();
          const kids: Child[] = childJson.data ?? [];
          setAllChildren(kids);
          setChildren(kids);
          if (kids.length === 0) setNotRegistered(true);
        }
      })
      .catch(() => setNotRegistered(true))
      .finally(() => setChildLoading(false));
  }, [liff.ready, liff.profile?.userId]);

  /* ── Save cohortId to localStorage ── */
  useEffect(() => {
    if (cohortId) {
      localStorage.setItem('selectedCohortId', cohortId);
    }
  }, [cohortId]);

  /* ── Filter children by cohort (teacher mode only) ── */
  useEffect(() => {
    if (currentUser?.role !== 'teacher' || !cohortId) {
      if (currentUser?.role !== 'teacher') {
        setChildren(allChildren);
      }
      return;
    }
    
    // Filter children by current enrollment in selected cohort
    fetch(`/api/enrollments?cohort_id=${cohortId}`)
      .then(r => r.json())
      .then(j => {
        const enrollments = j.data ?? [];
        const childIdsInCohort = new Set(enrollments.map((e: any) => e.child_id));
        const filtered = allChildren.filter(c => childIdsInCohort.has(c.id));
        setChildren(filtered);
        
        // Reset childId if current child is not in this cohort
        if (childId && !childIdsInCohort.has(childId)) {
          setChildId(filtered.length > 0 ? filtered[0].id : '');
        }
      });
  }, [cohortId, allChildren, currentUser, childId]);

  /* ── Auto-select first child ── */
  useEffect(() => {
    if (children.length > 0 && !childId) {
      const savedChildId = localStorage.getItem('selectedChildId');
      if (savedChildId && children.find(c => c.id === savedChildId)) {
        setChildId(savedChildId);
      } else {
        setChildId(children[0].id);
      }
    }
  }, [children, childId]);

  /* ── Save childId to localStorage ── */
  useEffect(() => {
    if (childId) {
      localStorage.setItem('selectedChildId', childId);
    }
  }, [childId]);

  /* ── Load parents when child changes ── */
  useEffect(() => {
    if (currentUser?.role === 'teacher' && !childId) {
      setParents([]);
      setParentId(null);
      return;
    }
    
    if (!childId) {
      setParents([]);
      setParentId(null);
      hasInitialized.current = false;
      return;
    }
    
    let cancelled = false;
    fetch(`/api/report/child-parents?child_id=${childId}`)
      .then(r => r.json())
      .then(j => {
        if (!cancelled) {
          const parentsList = j.data ?? [];
          setParents(parentsList);
          
          const savedParentId = localStorage.getItem('selectedParentId');
          if (savedParentId && parentsList.find((p: AppUser) => p.id === savedParentId)) {
            setParentId(savedParentId);
          }
          
          hasInitialized.current = true;
        }
      });
    
    return () => { cancelled = true; };
  }, [childId, currentUser]);

  /* ── Save parentId to localStorage ── */
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    if (parentId) {
      localStorage.setItem('selectedParentId', parentId);
    } else {
      localStorage.removeItem('selectedParentId');
    }
  }, [parentId]);

  /* ── Load enrollment period ── */
  useEffect(() => {
    if (!childId) return;
    
    let cancelled = false;
    fetch(`/api/report/enrollment-period?child_id=${childId}`)
      .then(r => r.json())
      .then(j => {
        if (!cancelled && j.data?.start_date) {
          setEnrollmentPeriod({
            start: j.data.start_date,
            end: j.data.end_date
          });
        }
      })
      .catch(() => {
        if (!cancelled) setEnrollmentPeriod(null);
      });
    
    return () => { cancelled = true; };
  }, [childId]);

  const value: UserAppContextType = {
    currentUser,
    liffReady: liff.ready,
    notRegistered,
    children,
    allChildren,
    parents,
    childId,
    parentId,
    childLoading,
    cohorts,
    cohortId,
    setCohortId,
    enrollmentPeriod,
    setChildId,
    setParentId
  };

  return (
    <UserAppContext.Provider value={value}>
      {reactChildren}
    </UserAppContext.Provider>
  );
}

export function useUserApp() {
  const context = useContext(UserAppContext);
  if (context === undefined) {
    throw new Error('useUserApp must be used within UserAppProvider');
  }
  return context;
}
