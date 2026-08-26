import type { CenterInput } from "./centers.model.ts";
import { model, Schema, Types } from "mongoose";
import CenterModel from "./centers.model.ts";

export class CenterError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const RESERVED = new Set(["api", "app", "auth", "admin", "core", "mail", "staging", "support", "uat", "www"]);

const CounterModel = model(
  "CenterCounter",
  new Schema({ _id: { type: String, required: true }, sequence: { type: Number, required: true } }),
  "counters",
);

async function nextPublicId() {
  const counter = await CounterModel.findByIdAndUpdate(
    "center_public_id",
    [{ $set: { sequence: { $add: [{ $ifNull: ["$sequence", 1000] }, 1] } } }],
    { new: true, upsert: true },
  ).lean();
  return `CTR-${counter.sequence}`;
}

function namespace(value: unknown) {
  const result = String(value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(result)) {
    throw new CenterError("Center namespace must be 3-63 lowercase letters, numbers, or hyphens");
  }
  if (RESERVED.has(result)) throw new CenterError("Center namespace is reserved", 409);
  return result;
}

function required(value: unknown, field: string) {
  const result = String(value ?? "").trim();
  if (!result) throw new CenterError(`${field} is required`);
  return result;
}

function api(row: any) {
  return {
    id: String(row._id),
    publicId: String(row.publicId),
    namespace: String(row.namespace),
    name: String(row.name),
    logo: row.logo ?? null,
    url: `https://${row.namespace}.pedconnect.anakloud.com`,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CentersService {
  async list() {
    return (await CenterModel.find({}).sort({ name: 1 }).lean()).map((row) => api(row));
  }

  async get(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new CenterError("Center not found", 404);
    const row = await CenterModel.findById(id).lean();
    if (!row) throw new CenterError("Center not found", 404);
    return api(row);
  }

  async getByNamespace(value: string) {
    const row = await CenterModel.findOne({ namespace: namespace(value) }).lean();
    if (!row) throw new CenterError("Center not found", 404);
    return api(row);
  }

  async create(input: CenterInput) {
    try {
      const row = await CenterModel.create({
        publicId: await nextPublicId(),
        namespace: namespace(input.namespace),
        name: required(input.name, "name"),
      });
      return api(row.toObject());
    } catch (error: any) {
      if (error?.code === 11000) throw new CenterError("Center namespace or public ID already exists", 409);
      throw error;
    }
  }

  async update(id: string, input: CenterInput) {
    const patch: Record<string, string | null> = {};
    if (input.name !== undefined) patch.name = required(input.name, "name");
    if (input.namespace !== undefined) patch.namespace = namespace(input.namespace);
    if (input.logo !== undefined) patch.logo = input.logo ? String(input.logo).trim() : null;
    if (!Types.ObjectId.isValid(id)) throw new CenterError("Center not found", 404);
    const row = await CenterModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    if (!row) throw new CenterError("Center not found", 404);
    return api(row);
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new CenterError("Center not found", 404);
    const row = await CenterModel.findByIdAndDelete(id).lean();
    if (!row) throw new CenterError("Center not found", 404);
    return { id: String(row._id) };
  }
}

export const centersService = new CentersService();
