/**
 * POST /api/otp/verify
 *
 * Verifies the 6-digit OTP stored in Firestore.
 * On success, the Firestore record is deleted.
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ref = doc(db, "otpCodes", normalizedEmail);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "OTP not found or already used. Please request a new one." }, { status: 400 });
    }

    const data = snap.data();

    // Check expiry
    if (Date.now() > data.expiresAt) {
      await deleteDoc(ref);
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Check max attempts
    if (data.attempts >= MAX_ATTEMPTS) {
      await deleteDoc(ref);
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 400 });
    }

    // Verify OTP
    if (data.otp !== otp.toString().trim()) {
      await updateDoc(ref, { attempts: increment(1) });
      const remaining = MAX_ATTEMPTS - (data.attempts + 1);
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    // ✅ Valid — delete OTP record
    await deleteDoc(ref);

    return NextResponse.json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
