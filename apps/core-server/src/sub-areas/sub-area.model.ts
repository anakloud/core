import { model, Schema, type Types } from "mongoose";

export interface ISubArea {
  name: string;
  targetArea: Types.ObjectId;
  order: number;
}

const collection = "sub_areas";

const SubAreaSchema = new Schema<ISubArea>(
  {
    name: { type: String, required: true, trim: true },
    targetArea: {
      type: Schema.Types.ObjectId,
      ref: "TargetArea",
      required: true,
    },
    order: { type: Number, required: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<ISubArea>("SubArea", SubAreaSchema, collection);
