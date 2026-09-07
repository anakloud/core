import { model, Schema } from "mongoose";

interface ICounter {
  _id: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true },
});

const CounterModel = model<ICounter>("Counter", CounterSchema, "counters");

export async function getNextSequenceId(
  counterId: string,
  prefix: string,
  startFrom = 1000,
): Promise<string> {
  const counter = await CounterModel.findByIdAndUpdate(
    counterId,
    [
      {
        $set: {
          sequence: {
            $add: [{ $ifNull: ["$sequence", startFrom] }, 1],
          },
        },
      },
    ],
    { new: true, upsert: true },
  ).lean();

  return `${prefix}-${counter.sequence}`;
}
