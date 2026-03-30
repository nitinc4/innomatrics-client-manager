import mongoose, { Schema, Model } from "mongoose";

export interface ISettings {
  _id?: string;
  reminderEmail: string;
  remindBefore: number; // minutes
  smtpUser?: string;
  smtpPass?: string;
  smtpHost?: string;
  smtpPort?: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    reminderEmail: { type: String, required: true },
    remindBefore: { type: Number, default: 30 },
    smtpUser: { type: String },
    smtpPass: { type: String },
    smtpHost: { type: String, default: 'smtp.gmail.com' },
    smtpPort: { type: Number, default: 465 },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

export default Settings;
