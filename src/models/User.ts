import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  _id?: string;
  name: string;
  username: string;
  password?: string;
  role: "admin" | "employee";
  email: string;
  contactNumber?: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
