import { model, Schema } from "mongoose";

export interface CenterInput {
  namespace?: string;
  name?: string;
}

export interface CenterModel {
  publicId: string;
  namespace: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const CenterSchema = new Schema<CenterModel>(
  {
    publicId: { type: String, required: true, unique: true, immutable: true },
    namespace: { type: String, required: true, trim: true, lowercase: true, unique: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

export default model<CenterModel>("Center", CenterSchema, "centers");
