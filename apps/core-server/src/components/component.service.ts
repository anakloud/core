import { type Model } from "mongoose";
import ComponentModel, { type IComponent } from "./component.model.ts";

export class ComponentService {
  private componentModel: Model<IComponent> = ComponentModel;

  async getAll(queries?: Record<string, string>) {
    return await this.componentModel.find({ ...queries });
  }

  async create(body: Partial<IComponent>) {
    return await this.componentModel.create(body);
  }

  async update(id: string, body: Partial<IComponent>) {
    return await this.componentModel.findByIdAndUpdate(id, body);
  }

  async delete(id: string) {
    return await this.componentModel.findByIdAndDelete(id);
  }
}
