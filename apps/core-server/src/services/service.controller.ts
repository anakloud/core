import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import type { IService } from "./service.model.ts";
import ServiceModel from "./service.model.ts";
import { Types, type Model } from "mongoose";

@Controller("/services")
export class ServiceController {
  private readonly serviceModel: Model<IService> = ServiceModel;

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const payload: Record<string, string | boolean> = { ...queries };

    if (queries["active"] === "true") {
      payload["active"] = true;
    }

    if (queries["active"] === "false") {
      payload["active"] = false;
    }

    const services = await this.serviceModel.aggregate([
      {
        $addFields: { id: { $toString: "$_id" } },
      },
      { $match: payload },
      {
        $lookup: {
          from: "target_areas",
          localField: "_id",
          foreignField: "service",
          as: "targetAreas",
        },
      },
      {
        $lookup: {
          from: "sub_areas",
          localField: "targetAreas._id",
          foreignField: "targetArea",
          as: "subAreas",
        },
      },
      {
        $lookup: {
          from: "components",
          localField: "subAreas._id",
          foreignField: "subArea",
          as: "components",
        },
      },
      {
        $addFields: {
          targetAreaCount: { $size: "$targetAreas" },
          subAreaCount: { $size: "$subAreas" },
          componentCount: { $size: "$components" },
        },
      },
      { $project: { targetAreas: 0, subAreas: 0, components: 0 } },
      { $sort: { name: 1 } },
    ]);
    return c.json(services);
  }

  @Get("/:id")
  async getById(c: Context) {
    const id = c.req.param("id");
    const service = await this.serviceModel.aggregate([
      {
        $addFields: {
          id: { $toString: "$_id" },
        },
      },
      {
        $match: Types.ObjectId.isValid(id) ? { id } : { publicId: id },
      },
      {
        $lookup: {
          from: "target_areas",
          let: { serviceId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$service", "$$serviceId"] },
              },
            },
            { $addFields: { id: { $toString: "$_id" } } },
            { $sort: { order: 1 } },
            {
              $lookup: {
                from: "sub_areas",
                let: { targetAreaId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$targetArea", "$$targetAreaId"] },
                    },
                  },
                  { $addFields: { id: { $toString: "$_id" } } },
                  { $sort: { order: 1 } },
                  {
                    $lookup: {
                      from: "components",
                      let: { subAreaId: "$_id" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$subArea", "$$subAreaId"] },
                          },
                        },
                        { $addFields: { id: { $toString: "$_id" } } },
                        { $sort: { order: 1 } },
                        {
                          $lookup: {
                            from: "goals",
                            let: { componentId: "$_id" },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$component", "$$componentId"],
                                  },
                                },
                              },
                              { $count: "count" },
                            ],
                            as: "goalSummary",
                          },
                        },
                        {
                          $addFields: {
                            goalCount: {
                              $ifNull: [
                                { $arrayElemAt: ["$goalSummary.count", 0] },
                                0,
                              ],
                            },
                          },
                        },
                        { $project: { goalSummary: 0 } },
                      ],
                      as: "components",
                    },
                  },
                ],
                as: "subAreas",
              },
            },
          ],
          as: "targetAreas",
        },
      },
    ]);
    return c.json(service[0] ?? null);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const service = await this.serviceModel.create(body);
    return c.json(service);
  }

  @Patch("/:id")
  async update(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { publicId: id };
    const service = await this.serviceModel.findOneAndUpdate(filter, body, {
      new: true,
    });
    return c.json(service);
  }

  @Delete("/:id")
  async remove(c: Context) {
    const id = c.req.param("id");
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { publicId: id };
    await this.serviceModel.findOneAndDelete(filter);
    return c.json({ success: true, id });
  }
}
