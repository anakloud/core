import { model, Schema, type Types } from "mongoose";

export interface IComponent {
  name: string;
  subArea: Types.ObjectId;
  order: number;
}

const collection = "components";

const ComponentSchema = new Schema<IComponent>(
  {
    name: { type: String, required: true, trim: true },
    subArea: { type: Schema.Types.ObjectId, ref: "SubArea", required: true },
    order: { type: Number, required: true },
  },
  {
    collection,
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model<IComponent>("Component", ComponentSchema, collection);
