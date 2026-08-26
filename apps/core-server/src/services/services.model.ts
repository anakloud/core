import { model, Schema } from "mongoose";

export interface ServiceInput {
  code?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  defaultDurationMins?: number | null;
  active?: boolean;
}

export interface ServiceModel extends Required<Pick<ServiceInput, "code" | "name" | "active">> {
  publicId: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  defaultDurationMins?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceModel>(
  {
    publicId: { type: String, required: true, unique: true, immutable: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    type: { type: String, default: null },
    defaultDurationMins: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

export default model<ServiceModel>("Service", ServiceSchema, "services");
