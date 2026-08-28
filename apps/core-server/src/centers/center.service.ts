import type { ICenter } from "./center.model.ts";
import { Model, Types } from "mongoose";
import CenterModel from "./center.model.ts";
import { getNextSequenceId } from "../shared/sequence.ts";

export class CenterService {
  private centerModel: Model<ICenter> = CenterModel;

  async getAll() {
    return this.centerModel.aggregate([
      {
        $addFields: {
          url: {
            $concat: ["https://", "$namespace", ".pedconnect.anakloud.com"],
          },
        },
      },
    ]);
  }

  async getById(id: string) {
    return this.centerModel.findById(id);
  }

  async getByNamespace(namespace: string) {
    return this.centerModel.findOne({ namespace });
  }

  #getNamespace(value: unknown) {
    const result = String(value ?? "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(result)) {
      throw Error(
        "Center namespace must be 3-63 lowercase letters, numbers, or hyphens",
      );
    }

    const RESERVED = new Set([
      "api",
      "app",
      "auth",
      "admin",
      "core",
      "mail",
      "staging",
      "support",
      "uat",
      "www",
    ]);

    if (RESERVED.has(result)) throw new Error("Center namespace is reserved");
    return result;
  }

  async create(body: Partial<ICenter>) {
    return this.centerModel.create({
      ...body,
      publicId: await getNextSequenceId("center_public_id", "CTR"),
      namespace: this.#getNamespace(body.namespace),
    });
  }

  async update(id: string, body: Partial<ICenter>) {
    return this.centerModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return this.centerModel.findByIdAndDelete(id);
  }
}
