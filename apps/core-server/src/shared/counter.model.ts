import { model, Schema } from "mongoose";

export interface ICounter {
  _id: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true },
});

export const CounterModel = model<ICounter>(
  "Counter",
  CounterSchema,
  "counters",
);
