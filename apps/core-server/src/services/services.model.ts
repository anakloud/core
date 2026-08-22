import { model, Schema } from "mongoose";

export interface ServiceInput {
  code?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  defaultDurationMins?: number | null;
  isActive?: boolean;
}

export interface ServiceModel extends Required<Pick<ServiceInput, "code" | "name" | "isActive">> {
  description?: string | null;
  category?: string | null;
  type?: string | null;
  defaultDurationMins?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceModel>(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    type: { type: String, default: null },
    defaultDurationMins: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

export default model<ServiceModel>("Service", ServiceSchema, "services");
