import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data, error: null }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string) {
  return NextResponse.json({ data: null, error: message }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ data: null, error: message }, { status: 404 });
}

export function serverError(err: unknown) {
  console.error('[API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return NextResponse.json({ data: null, error: message }, { status: 500 });
}

// Type สำหรับ API response
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};
