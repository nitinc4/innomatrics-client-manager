import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import OTP from "@/models/OTP";
import Settings from "@/models/Settings";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { action, email, otp, newPassword } = body;

    if (action === "request") {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Save OTP (invalidate old ones for this email first)
      await OTP.updateMany({ email }, { used: true });
      await OTP.create({ email, code, expiresAt });

      // Send Email
      const settings = await Settings.findOne();
      const transporter = nodemailer.createTransport({
        host: settings?.smtpHost || 'smtp.gmail.com',
        port: Number(settings?.smtpPort) || 465,
        secure: (Number(settings?.smtpPort) || 465) === 465,
        auth: {
          user: settings?.smtpUser || process.env.SMTP_USER,
          pass: settings?.smtpPass || process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Innomatrics CRM" <${settings?.smtpUser || process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Password Reset OTP",
        html: `
          <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: auto;">
            <h2 style="color: #4f46e5; margin-bottom: 24px;">Password Reset Request</h2>
            <p style="color: #475569; line-height: 1.5;">You requested a password reset for your Innomatrics account. Use the following 6-digit code to proceed:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 20px; background: #f8fafc; text-align: center; border-radius: 8px; color: #1e293b; margin: 24px 0;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 0.875rem;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">Innomatrics Technologies Management Portal</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return NextResponse.json({ message: "OTP sent to your email" });
    }

    if (action === "reset") {
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ error: "Email, OTP and new password are required" }, { status: 400 });
      }

      const otpDoc = await OTP.findOne({ 
        email, 
        code: otp, 
        used: false, 
        expiresAt: { $gt: new Date() } 
      });

      if (!otpDoc) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Mark OTP as used
      otpDoc.used = true;
      await otpDoc.save();

      return NextResponse.json({ message: "Password reset successful" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
