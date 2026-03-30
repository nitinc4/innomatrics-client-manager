import mongoose, { Schema, Model } from "mongoose";

export interface IStatus {
  _id?: string;
  name: string;
  color: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const StatusSchema = new Schema<IStatus>(
  {
    name: { type: String, required: true, unique: true },
    color: { type: String, default: "#6366f1" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Status: Model<IStatus> = mongoose.models.Status || mongoose.model("Status", StatusSchema);

export default Status;
