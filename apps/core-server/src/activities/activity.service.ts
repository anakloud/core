import { type Model } from "mongoose";
import ActivityModel, { type IActivity } from "./activity.model.ts";

export class ActivityService {
  private activityModel: Model<IActivity> = ActivityModel;

  async getAll(queries?: Record<string, string>) {
    return await this.activityModel.find({ ...queries });
  }

  async create(body: Partial<IActivity>) {
    return await this.activityModel.create(body);
  }

  async update(id: string, body: Partial<IActivity>) {
    return await this.activityModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return await this.activityModel.findByIdAndDelete(id);
  }
}
