/**
 * POST /api/otp/send
 *
 * Generates a 6-digit OTP, stores it in Firestore (TTL 10 min),
 * and sends it to the user's email via Gmail SMTP (nodemailer).
 *
 * REQUIRED env vars (server-side only):
 *   GMAIL_USER          = yourgmail@gmail.com
 *   GMAIL_APP_PASSWORD  = xxxx xxxx xxxx xxxx
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserByEmail } from "@/lib/firestore";

// Rate limiting (simple in-memory, per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 60_000 }); // 1-min window
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit check
    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 1 minute before requesting a new OTP." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in Firestore
    await setDoc(doc(db, "otpCodes", normalizedEmail), {
      otp,
      expiresAt,
      createdAt: serverTimestamp(),
      attempts: 0,
    });

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail);

    // Send email via nodemailer
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      // In development without email configured, return OTP in response
      console.warn("⚠️  GMAIL_USER / GMAIL_APP_PASSWORD not set. OTP (dev only):", otp);
      return NextResponse.json({
        success: true,
        isNewUser: !existingUser,
        devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
        message: "OTP generated (email not configured)",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"ChatApp" <${process.env.GMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Your ChatApp verification code",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#0B141A;font-family:sans-serif;">
            <div style="max-width:480px;margin:40px auto;background:#111B21;border-radius:16px;overflow:hidden;border:1px solid #2A3942;">
              <div style="background:#075E54;padding:32px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:28px;">ChatApp</h1>
              </div>
              <div style="padding:40px 32px;text-align:center;">
                <p style="color:#8696A0;font-size:16px;margin:0 0 16px;">Your verification code is:</p>
                <div style="background:#1F2C33;border-radius:12px;padding:24px;margin:0 0 24px;display:inline-block;width:100%;">
                  <span style="color:#25D366;font-size:48px;font-weight:bold;letter-spacing:12px;">${otp}</span>
                </div>
                <p style="color:#8696A0;font-size:14px;margin:0 0 8px;">This code expires in <strong style="color:#E9EDEF;">10 minutes</strong>.</p>
                <p style="color:#8696A0;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      isNewUser: !existingUser,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
