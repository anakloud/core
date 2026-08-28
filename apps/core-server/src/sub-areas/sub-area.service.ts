import { type Model } from "mongoose";
import SubAreaModel, { type ISubArea } from "./sub-area.model.ts";

export class SubAreaService {
  private subAreaModel: Model<ISubArea> = SubAreaModel;

  async getAll(queries?: Record<string, string>) {
    return await this.subAreaModel.find({ ...queries });
  }

  async create(body: Partial<ISubArea>) {
    return await this.subAreaModel.create(body);
  }

  async update(id: string, body: Partial<ISubArea>) {
    return await this.subAreaModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return await this.subAreaModel.findByIdAndDelete(id);
  }
}
