import mongoose, { Schema, Model } from "mongoose";

export interface ITask {
  _id?: string;
  clientId?: string;
  task: string;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
  assignedTo?: string; // Username of the employee
  createdBy: string; // Username of the creator
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    task: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    assignedTo: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const Task: Model<ITask> = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
