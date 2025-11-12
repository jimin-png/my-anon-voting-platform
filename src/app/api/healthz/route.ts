// src/app/api/healthz/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  let dbStatus = 'ok';

  try {
    await dbConnect(); // <- 여기서 실제로 연결 시도
  } catch (err) {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    db: dbStatus,
  });
}
