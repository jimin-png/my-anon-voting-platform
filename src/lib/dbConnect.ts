// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

// 🚨 디버깅용 환경 변수 확인
console.log(
  "ENV CHECK: NEXTAUTH_SECRET length:",
  process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : "UNDEFINED"
);
console.log(
  "ENV CHECK: CONTRACT_ADDRESS_VOTING:",
  process.env.CONTRACT_ADDRESS_VOTING ? "RECEIVED" : "UNDEFINED"
);

// 1. DB_URI 환경 변수 읽기
const DB_URI: string =
  process.env.DB_URI ??
  (() => {
    throw new Error(
      'Please define the DB_URI environment variable in your environment settings.'
    );
  })();

// 2. 글로벌 캐싱 변수 정의
let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  // @ts-ignore: 글로벌 변수 할당 시 TypeScript 오류 무시
  global.mongoose = cached;
}

// 3. DB 연결 함수
export default async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    // 🔥 여기서 에러 로그 추가
    console.error("❌ MongoDB connection error:", err);
    console.error(
      "🔍 DB_URI (sanitized):",
      DB_URI.replace(/\/\/.*@/, "//<credentials>@")
    );
    cached.promise = null;
    throw err;
  }

  return cached.conn!;
}
