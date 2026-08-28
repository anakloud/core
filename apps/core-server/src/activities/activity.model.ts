import { model, Schema, type Types } from "mongoose";

export interface IActivity {
  name: string;
  description: string;
  goal: Types.ObjectId;
  order: number;
}

const collection = "activities";

const ActivitySchema = new Schema<IActivity>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    goal: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    order: { type: Number, required: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<IActivity>("Activity", ActivitySchema, collection);
