import { type Model } from "mongoose";
import TargetAreaModel, { type ITargetArea } from "./target-area.model.ts";

export class TargetAreaService {
  private targetAreaModel: Model<ITargetArea> = TargetAreaModel;

  async getAll(queries?: Record<string, string>) {
    return await this.targetAreaModel.find({ ...queries });
  }

  async create(body: Partial<ITargetArea>) {
    return await this.targetAreaModel.create(body);
  }

  async update(id: string, body: Partial<ITargetArea>) {
    return await this.targetAreaModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return await this.targetAreaModel.findByIdAndDelete(id);
  }
}
