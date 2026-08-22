import { Types, type FilterQuery, type Model } from "mongoose";
import AreaModel from "../areas/areas.model.ts";
import ServiceModel from "../services/services.model.ts";
import { CatalogError } from "../services/services.service.ts";
import DomainModel, { type DomainInput, type DomainModel as IDomain } from "./domains.model.ts";

function idQuery(id: string) {
  return Types.ObjectId.isValid(id) ? { $or: [{ _id: new Types.ObjectId(id) }, { id }] } : { id };
}

function isDuplicateKey(cause: unknown) {
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === 11000;
}

export class DomainsService {
  private model: Model<IDomain> = DomainModel;

  async getAll(serviceId?: string, serviceCode?: string) {
    const query: FilterQuery<IDomain> = {};
    if (serviceId) {
      const service = await ServiceModel.findOne(idQuery(serviceId));
      if (!service) return [];
      query.service = service._id;
    } else if (serviceCode) {
      const service = await ServiceModel.findOne({ code: serviceCode.toUpperCase() });
      if (!service) return [];
      query.service = service._id;
    }

    const domains = await this.model.find(query).sort({ sortOrder: 1, name: 1 });
    return Promise.all(domains.map(async (domain) => ({
      ...domain.toObject(),
      serviceId: String(domain.service),
      areas: (await AreaModel.find({ domain: domain._id }).sort({ sortOrder: 1, name: 1 }))
        .map((area) => ({ ...area.toObject(), domainId: String(area.domain) })),
    })));
  }

  async create(input: DomainInput) {
    const name = input.name?.trim();
    if (!name) throw new CatalogError("Domain name is required");
    if (!input.serviceId) throw new CatalogError("serviceId is required");
    const service = await ServiceModel.findOne(idQuery(input.serviceId));
    if (!service) throw new CatalogError("Service not found", 404);
    const last = await this.model.findOne({ service: service._id }).sort({ sortOrder: -1 });
    try {
      const domain = await this.model.create({ name, service: service._id, sortOrder: (last?.sortOrder ?? 0) + 1 });
      return { ...domain.toObject(), serviceId: String(domain.service), areas: [] };
    } catch (cause) {
      if (isDuplicateKey(cause)) throw new CatalogError("This domain already exists for the service", 409);
      throw cause;
    }
  }

  async update(id: string, input: DomainInput) {
    const name = input.name?.trim();
    if (!name) throw new CatalogError("Domain name is required");
    try {
      const domain = await this.model.findOneAndUpdate(idQuery(id), { $set: { name } }, { new: true, runValidators: true });
      if (!domain) throw new CatalogError("Domain not found", 404);
      const areas = await AreaModel.find({ domain: domain._id }).sort({ sortOrder: 1, name: 1 });
      return { ...domain.toObject(), serviceId: String(domain.service), areas: areas.map((area) => ({ ...area.toObject(), domainId: String(area.domain) })) };
    } catch (cause) {
      if (isDuplicateKey(cause)) throw new CatalogError("This domain already exists for the service", 409);
      throw cause;
    }
  }

  async delete(id: string) {
    const domain = await this.model.findOneAndDelete(idQuery(id));
    if (!domain) throw new CatalogError("Domain not found", 404);
    await AreaModel.deleteMany({ domain: domain._id });
    return { id };
  }
}

export const domainsService = new DomainsService();
