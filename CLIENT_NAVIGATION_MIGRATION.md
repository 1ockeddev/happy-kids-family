# Client-Side Navigation Migration Status

## Goal
Convert all 5 user-facing pages to use `UserLayout` and `useUserApp` hook for proper client-side navigation without page reloads.

## Status: IN PROGRESS (40% Complete)

### ✅ Completed
1. Created `UserAppProvider` context with shared state (currentUser, children, parents, childId, parentId, enrollmentPeriod)
2. Created `UserLayout` wrapper component (includes AppHeader + BottomNavigation)
3. Updated `BottomNavigation` to use Next.js `Link` for client-side nav
4. Wrapped root layout with `UserAppProvider`
5. Deleted unused `AppLayout.tsx` component

### 🚧 In Progress
Converting 5 pages to use UserLayout (NONE COMPLETED YET):
- `app/page.tsx` (Main page)
- `app/summary-behavior/page.tsx`
- `app/summary-food-milk/page.tsx`
- `app/summary-nap/page.tsx`
- `app/summary-excretion/page.tsx`

## Instructions to Complete

### Step 1: Update Imports
```tsx
// REMOVE these imports:
import { useLiff } from '@/lib/useLiff';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

// ADD these imports:
import UserLayout from '@/components/UserLayout';
import { useUserApp } from '@/components/UserAppProvider';
```

### Step 2: Remove Duplicate State
Delete these state declarations (now in UserAppProvider):
```tsx
// DELETE:
const [currentUser, setCurrentUser] = useState<AppUser|null>(null);
const [parents, setParents] = useState<AppUser[]>([]);
const [children, setChildren] = useState<Child[]>([]);
const [parentId, setParentId] = useState<string|null>(null);
const [childId, setChildId] = useState<string|null>(null);
const [childLoading, setChildLoading] = useState(false);
const [notRegistered, setNotRegistered] = useState(false);
const [enrollmentPeriod, setEnrollmentPeriod] = useState<{start:string;end:string|null}|null>(null);
const hasRestoredParent = React.useRef(false);
const hasInitialized = React.useRef(false);
```

### Step 3: Get State from Context
```tsx
// ADD at top of component:
const { 
  currentUser,
  children, 
  childId, 
  childLoading, 
  enrollmentPeriod 
} = useUserApp();
```

### Step 4: Remove Duplicate useEffects
Delete these entire useEffect blocks:
- `/* ── LIFF ready ── */` useEffect
- `/* ── child → parents ── */` useEffect  
- Auto-select first child useEffect
- Save childId to localStorage useEffect
- Save parentId to localStorage useEffect
- Load enrollment period useEffect (except in main page which loads holidays/activities)

### Step 5: Update Component Return
```tsx
// REMOVE the entire outer wrapper:
<div style={{background:'#f8fafc',minHeight:'100dvh',...}}>
  <div style={{width:'100%',maxWidth:480,...}}>
    <AppHeader ... />
    {/* content */}
    <BottomNavigation />
  </div>
</div>

// REMOVE loading and not-registered screens

// REPLACE with:
<UserLayout>
  {/* content only */}
</UserLayout>
```

## Page-Specific Notes

### Summary Pages (Easier - Do These First)
- `summary-behavior`: Keep behaviorSummary, dayEntries, foodSummary state
- `summary-food-milk`: Keep foodSummary state
- `summary-nap`: Keep napSummary state
- `summary-excretion`: Keep excretionSummary state

### Main Page (Most Complex - Do This Last)
- Keep ALL page-specific state: dayEntries, dayIdx, report, attendance, scores, teacher, holidays, activities, cohortId, copied, behaviorSummary, allBehaviorScores, foodSummary
- Keep enrollment period loading ONLY for holidays/activities (not the enrollment period itself)
- Keep all calendar logic, auto-scroll, dev mode toggle
- Just remove LIFF/auth/parent/child selection logic

## Testing Checklist
After converting each page:
- [ ] URL changes without full page reload
- [ ] Header stays mounted (doesn't flash/reload)
- [ ] Bottom nav stays mounted
- [ ] Selected child persists across navigation
- [ ] Selected parent persists across navigation
- [ ] Teacher mode shows correct selectors
- [ ] Parent mode shows correct selectors
- [ ] Data loads correctly on each page

## Example: summary-nap/page.tsx

### BEFORE (178 lines)
```tsx
export default function NapSummaryPage() {
  const liff = useLiff();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [parents, setParents] = useState<AppUser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parentId, setParentId] = useState<string|null>(null);
  const [childId, setChildId] = useState<string|null>(null);
  const [childLoading, setChildLoading] = useState(false);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<...>(null);
  // ... 100+ lines of LIFF/auth/parent/child logic ...
  
  return (
    <div style={{background:'#f8fafc',...}}>
      <AppHeader ... />
      {/* content */}
      <BottomNavigation />
    </div>
  );
}
```

### AFTER (should be ~80 lines)
```tsx
export default function NapSummaryPage() {
  const { childId, enrollmentPeriod } = useUserApp();
  const [dataLoading, setDataLoading] = useState(false);
  const [napSummary, setNapSummary] = useState<...>({...});
  
  useEffect(() => {
    if (!childId || !enrollmentPeriod) return;
    // ... load nap data
  }, [childId, enrollmentPeriod]);
  
  return (
    <UserLayout>
      {/* content only */}
    </UserLayout>
  );
}
```

## Priority Order
1. ✅ summary-nap (simplest)
2. ⏳ summary-excretion
3. ⏳ summary-food-milk
4. ⏳ summary-behavior
5. ⏳ page.tsx (main - most complex)
