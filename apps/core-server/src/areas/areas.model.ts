import { model, Schema, type Types } from "mongoose";

export interface AreaInput {
  name?: string;
  domainId?: string;
}
export interface AreaModel {
  name: string;
  domain: Types.ObjectId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AreaSchema = new Schema<AreaModel>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: Schema.Types.ObjectId, ref: "Domain", required: true },
    sortOrder: { type: Number, required: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

AreaSchema.index({ domain: 1, name: 1 }, { unique: true });

export default model<AreaModel>("Area", AreaSchema, "areas");
