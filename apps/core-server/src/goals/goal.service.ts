import { type Model } from "mongoose";
import GoalModel, { type IGoal } from "./goal.model.ts";

export class GoalService {
  private goalModel: Model<IGoal> = GoalModel;

  async getAll(queries?: Record<string, string>) {
    return await this.goalModel.find({ ...queries });
  }

  async create(body: Partial<IGoal>) {
    return await this.goalModel.create(body);
  }

  async update(id: string, body: Partial<IGoal>) {
    return await this.goalModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return await this.goalModel.findByIdAndDelete(id);
  }
}
