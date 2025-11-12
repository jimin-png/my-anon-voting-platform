import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err: any) {
    console.error("❌ DB connection failed:", err);
    res.status(500).json({ status: "error", db: "failed", error: err.message });
  }
}
