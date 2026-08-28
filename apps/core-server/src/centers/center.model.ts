import { model, Schema } from "mongoose";

export interface ICenter {
  publicId: string;
  namespace: string;
  name: string;
  logo?: string;
}

const collectionName = "centers";

const CenterSchema = new Schema<ICenter>(
  {
    publicId: { type: String, required: true, unique: true, immutable: true },
    namespace: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
  },
  {
    collection: collectionName,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<ICenter>("Center", CenterSchema, "centers");
