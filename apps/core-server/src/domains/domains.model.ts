import { model, Schema, type Types } from "mongoose";

export interface DomainInput { name?: string; serviceId?: string; }
export interface DomainModel {
  name: string;
  service: Types.ObjectId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<DomainModel>(
  {
    name: { type: String, required: true, trim: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    sortOrder: { type: Number, required: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

DomainSchema.index({ service: 1, name: 1 }, { unique: true });

export default model<DomainModel>("Domain", DomainSchema, "domains");
