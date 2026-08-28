import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import { ActivityService } from "./activity.service.ts";

@Controller("/activities")
export class ActivitiesController {
  private activityService = new ActivityService();

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const activities = await this.activityService.getAll(queries);
    return c.json(activities);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const activity = await this.activityService.create(body);
    return c.json(activity);
  }

  @Patch("/:id")
  async update(c: Context) {
    const body = await c.req.json();
    const id = c.req.param("id");
    const activity = await this.activityService.update(id, body);
    return c.json(activity);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.activityService.delete(id);
    return c.json({ success: true, id });
  }
}
