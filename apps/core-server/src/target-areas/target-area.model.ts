import { model, Schema, type Types } from "mongoose";

export interface ITargetArea {
  name: string;
  service: Types.ObjectId;
  order: number;
}

const collection = "target_areas";

const TargetAreaSchema = new Schema<ITargetArea>(
  {
    name: { type: String, required: true, trim: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    order: { type: Number, required: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<ITargetArea>("TargetArea", TargetAreaSchema, collection);
