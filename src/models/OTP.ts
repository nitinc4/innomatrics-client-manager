import mongoose, { Schema, Model } from "mongoose";

export interface IOTP {
  email: string;
  code: string;
  expiresAt: Date;
  used: boolean;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired codes
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);

export default OTP;
