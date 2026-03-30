import mongoose, { Schema, Model } from "mongoose";

export interface INote {
  _id?: string;
  clientId: string | mongoose.Types.ObjectId;
  author: string;
  authorRole: "admin" | "employee";
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema = new Schema<INote>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    author: { type: String, required: true },
    authorRole: { type: String, enum: ["admin", "employee"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Note: Model<INote> = mongoose.models.Note || mongoose.model("Note", NoteSchema);

export default Note;
