// =============================================
// API Client — ทุก fetch ผ่านที่นี่
// เปลี่ยน BASE_URL ตอนขึ้น production ได้เลย
// =============================================

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  // 204 No Content
  if (res.status === 204) return null as T;

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

// ── Generic CRUD helpers ─────────────────────

export function apiGet<T>(path: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<T>(`${path}${qs}`);
}

export function apiPost<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiDelete(path: string) {
  return request<null>(path, { method: 'DELETE' });
}

// ── Resource helpers ─────────────────────────

// Children
export const childrenApi = {
  list: (search?: string) => apiGet<unknown[]>('/api/children', search ? { search } : {}),
  create: (b: object) => apiPost('/api/children', b),
  update: (id: string, b: object) => apiPatch(`/api/children/${id}`, b),
  delete: (id: string) => apiDelete(`/api/children/${id}`),
};

// Cohorts
export const cohortsApi = {
  list: (search?: string) => apiGet<unknown[]>('/api/cohorts', search ? { search } : {}),
  create: (b: object) => apiPost('/api/cohorts', b),
  update: (id: string, b: object) => apiPatch(`/api/cohorts/${id}`, b),
  delete: (id: string) => apiDelete(`/api/cohorts/${id}`),
};

// Enrollments
export const enrollmentsApi = {
  list: (params?: Record<string, string>) => apiGet<unknown[]>('/api/enrollments', params),
  create: (b: object) => apiPost('/api/enrollments', b),
  update: (id: string, b: object) => apiPatch(`/api/enrollments/${id}`, b),
  delete: (id: string) => apiDelete(`/api/enrollments/${id}`),
};

// Daily
export const dailyApi = {
  list: (params?: Record<string, string>) => apiGet<unknown[]>('/api/daily', params),
  create: (b: object) => apiPost('/api/daily', b),
  update: (id: string, b: object) => apiPatch(`/api/daily/${id}`, b),
  delete: (id: string) => apiDelete(`/api/daily/${id}`),
};

// Attendance
export const attendanceApi = {
  list: (params?: Record<string, string>) => apiGet<unknown[]>('/api/attendance', params),
  upsert: (b: object) => apiPost('/api/attendance', b),
  update: (id: string, b: object) => apiPatch(`/api/attendance/${id}`, b),
  delete: (id: string) => apiDelete(`/api/attendance/${id}`),
};

// Daily Reports
export const dailyReportsApi = {
  list: (params?: Record<string, string>) => apiGet<unknown[]>('/api/daily-reports', params),
  upsert: (b: object) => apiPost('/api/daily-reports', b),
  update: (id: string, b: object) => apiPatch(`/api/daily-reports/${id}`, b),
  delete: (id: string) => apiDelete(`/api/daily-reports/${id}`),
};

// Behavior Categories (includes items via json_agg)
export const behaviorCategoriesApi = {
  list: () => apiGet<unknown[]>('/api/behavior-categories'),
  create: (b: object) => apiPost('/api/behavior-categories', b),
  update: (id: string, b: object) => apiPatch(`/api/behavior-categories/${id}`, b),
  delete: (id: string) => apiDelete(`/api/behavior-categories/${id}`),
};

// Behavior Items
export const behaviorItemsApi = {
  list: (category_id?: string) => apiGet<unknown[]>('/api/behavior-items', category_id ? { category_id } : {}),
  create: (b: object) => apiPost('/api/behavior-items', b),
  update: (id: string, b: object) => apiPatch(`/api/behavior-items/${id}`, b),
  delete: (id: string) => apiDelete(`/api/behavior-items/${id}`),
};

// Users
export const usersApi = {
  list: (params?: Record<string, string>) => apiGet<unknown[]>('/api/users', params),
  create: (b: object) => apiPost('/api/users', b),
  update: (id: string, b: object) => apiPatch(`/api/users/${id}`, b),
  delete: (id: string) => apiDelete(`/api/users/${id}`),
};
