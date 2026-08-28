import { CounterModel } from "./counter.model.ts";

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
