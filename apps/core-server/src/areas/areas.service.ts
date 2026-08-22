import { Types, type FilterQuery, type Model } from "mongoose";
import DomainModel from "../domains/domains.model.ts";
import { CatalogError } from "../services/services.service.ts";
import AreaModel, { type AreaInput, type AreaModel as IArea } from "./areas.model.ts";

function idQuery(id: string) {
  return Types.ObjectId.isValid(id) ? { $or: [{ _id: new Types.ObjectId(id) }, { id }] } : { id };
}

function isDuplicateKey(cause: unknown) {
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === 11000;
}

export class AreasService {
  private model: Model<IArea> = AreaModel;

  async getAll(domainId?: string) {
    const query: FilterQuery<IArea> = {};
    if (domainId) {
      const domain = await DomainModel.findOne(idQuery(domainId));
      if (!domain) return [];
      query.domain = domain._id;
    }
    const areas = await this.model.find(query).sort({ sortOrder: 1, name: 1 });
    return areas.map((area) => ({ ...area.toObject(), domainId: String(area.domain) }));
  }

  async create(input: AreaInput) {
    const name = input.name?.trim();
    if (!name) throw new CatalogError("Area name is required");
    if (!input.domainId) throw new CatalogError("domainId is required");
    const domain = await DomainModel.findOne(idQuery(input.domainId));
    if (!domain) throw new CatalogError("Domain not found", 404);
    const last = await this.model.findOne({ domain: domain._id }).sort({ sortOrder: -1 });
    try {
      const area = await this.model.create({ name, domain: domain._id, sortOrder: (last?.sortOrder ?? 0) + 1 });
      return { ...area.toObject(), domainId: String(area.domain) };
    } catch (cause) {
      if (isDuplicateKey(cause)) throw new CatalogError("This area already exists for the domain", 409);
      throw cause;
    }
  }

  async update(id: string, input: AreaInput) {
    const name = input.name?.trim();
    if (!name) throw new CatalogError("Area name is required");
    try {
      const area = await this.model.findOneAndUpdate(idQuery(id), { $set: { name } }, { new: true, runValidators: true });
      if (!area) throw new CatalogError("Area not found", 404);
      return { ...area.toObject(), domainId: String(area.domain) };
    } catch (cause) {
      if (isDuplicateKey(cause)) throw new CatalogError("This area already exists for the domain", 409);
      throw cause;
    }
  }

  async delete(id: string) {
    const area = await this.model.findOneAndDelete(idQuery(id));
    if (!area) throw new CatalogError("Area not found", 404);
    return { id };
  }
}

export const areasService = new AreasService();
