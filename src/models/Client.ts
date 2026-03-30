import mongoose, { Schema, Model } from "mongoose";

export interface IClient {
  _id?: string;
  name: string;
  contactNumber: string;
  location: string;
  business: string;
  requirement: string;
  description: string;
  status: string;
  assign: string;
  callbackMonth: string;
  callback: string;
  reminderSent: boolean;
  isDiscarded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    location: { type: String },
    business: { type: String },
    requirement: { type: String },
    description: { type: String },
    status: { type: String, default: 'Active' },
    assign: { type: String },
    callbackMonth: { type: String },
    callback: { type: String },
    reminderSent: { type: Boolean, default: false },
    isDiscarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Client: Model<IClient> = mongoose.models.Client || mongoose.model("Client", ClientSchema);

export default Client;
