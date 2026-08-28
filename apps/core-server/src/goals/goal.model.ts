import { model, Schema, type Types } from "mongoose";

export interface IGoal {
  name: string;
  component: Types.ObjectId;
  fromAge?: number;
  toAge?: number;
  notes?: string;
  phase?: string;
  order: number;
}

const collection = "goals";

const GoalSchema = new Schema<IGoal>(
  {
    name: { type: String, required: true, trim: true },
    component: {
      type: Schema.Types.ObjectId,
      ref: "Component",
      required: true,
    },
    fromAge: { type: Number },
    toAge: { type: Number },
    notes: { type: String, trim: true },
    phase: { type: String, trim: true },
    order: { type: Number, required: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<IGoal>("Goal", GoalSchema, collection);
