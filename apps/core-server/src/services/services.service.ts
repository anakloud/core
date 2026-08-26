import { Types, type FilterQuery, type Model } from "mongoose";
import type { ServiceInput } from "./services.model.ts";
import ServiceModel, { type ServiceModel as IService } from "./services.model.ts";

export class CatalogError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function idQuery(id: string) {
  return Types.ObjectId.isValid(id)
    ? { $or: [{ _id: new Types.ObjectId(id) }, { id }] }
    : { id };
}

export class ServicesService {
  private model: Model<IService> = ServiceModel;

  async getAll(active?: boolean) {
    const query: FilterQuery<IService> = {};
    if (active !== undefined) query.active = active;
    return this.model.find(query).sort({ code: 1 });
  }

  async getById(id: string) {
    const row = await this.model.findOne(idQuery(id));
    if (!row) throw new CatalogError("Service not found", 404);
    return row;
  }

  async create(input: ServiceInput) {
    return this.model.create({ ...input, active: input.active ?? true });
  }

  async update(id: string, input: ServiceInput) {
    const result = await this.model.findOneAndUpdate(
      idQuery(id),
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!result) throw new CatalogError("Service not found", 404);
    return result;
  }

  async delete(id: string) {
    const result = await this.model.findOneAndDelete(idQuery(id));
    if (!result) throw new CatalogError("Service not found", 404);
    return { id };
  }
}

export const servicesService = new ServicesService();
