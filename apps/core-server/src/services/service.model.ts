import { model, Schema } from "mongoose";

export interface IService {
  publicId: string;
  name: string;
  description: string;
  category: string;
  type: string;
  active: boolean;
}

const collection = "services";

const ServiceSchema = new Schema<IService>(
  {
    publicId: { type: String, required: true, unique: true, immutable: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    type: { type: String },
    active: { type: Boolean, default: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<IService>("Service", ServiceSchema, collection);
