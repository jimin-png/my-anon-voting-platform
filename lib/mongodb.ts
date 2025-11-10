// lib/mongodb.ts
import { MongoClient } from 'mongodb';

// 🚨 Next.js 서버에서 DB_URI 환경 변수를 직접 읽습니다.
const uri = process.env.DB_URI;

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  // DB_URI가 환경 변수에 설정되어 있는지 확인합니다.
  throw new Error('Please add your MongoDB connection string to the DB_URI environment variable');
}

// 🚨 Next.js의 개발/운영 환경 캐시 로직을 단순화하고,
// 전역 객체에 클라이언트 연결을 캐시하는 방식을 유지합니다.


if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 HMR(Hot Module Replacement) 때문에 글로벌 변수에 캐시합니다.
  // @ts-expect-error
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // @ts-expect-error
    global._mongoClientPromise = client.connect();
  }
  // @ts-expect-error
  clientPromise = global._mongoClientPromise;
} else {
  // 운영 환경에서는 매번 새 클라이언트를 만들고 연결합니다.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// 🚨 이제 외부에서 uri를 전달할 필요 없이 clientPromise를 익스포트합니다.
export default clientPromise;