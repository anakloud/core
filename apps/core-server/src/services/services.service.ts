import { model, Schema, type FilterQuery, type Model } from "mongoose";
import type { ServiceInput } from "./services.model.ts";
import ServiceModel, { type ServiceModel as IService } from "./services.model.ts";

export class CatalogError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function publicIdQuery(publicId: string) {
  return { publicId };
}

const CounterModel = model(
  "ServiceCounter",
  new Schema({
    _id: { type: String, required: true },
    sequence: { type: Number, required: true },
  }),
  "counters",
);

async function nextPublicId() {
  const counter = await CounterModel.findByIdAndUpdate(
    "service_public_id",
    [{ $set: { sequence: { $add: [{ $ifNull: ["$sequence", 1000] }, 1] } } }],
    { new: true, upsert: true },
  ).lean();
  return `SRV-${counter.sequence}`;
}

export class ServicesService {
  private model: Model<IService> = ServiceModel;

  async getAll(active?: boolean) {
    const query: FilterQuery<IService> = {};
    if (active !== undefined) query.active = active;
    return this.model.find(query).sort({ code: 1 });
  }

  async getByPublicId(publicId: string) {
    const row = await this.model.findOne(publicIdQuery(publicId));
    if (!row) throw new CatalogError("Service not found", 404);
    return row;
  }

  async create(input: ServiceInput) {
    return this.model.create({
      ...input,
      publicId: await nextPublicId(),
      active: input.active ?? true,
    });
  }

  async update(publicId: string, input: ServiceInput) {
    const result = await this.model.findOneAndUpdate(
      publicIdQuery(publicId),
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!result) throw new CatalogError("Service not found", 404);
    return result;
  }

  async delete(publicId: string) {
    const result = await this.model.findOneAndDelete(publicIdQuery(publicId));
    if (!result) throw new CatalogError("Service not found", 404);
    return { publicId: result.publicId };
  }
}

export const servicesService = new ServicesService();
