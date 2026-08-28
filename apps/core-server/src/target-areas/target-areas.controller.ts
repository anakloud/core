import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import { TargetAreaService } from "./target-area.service.ts";

@Controller("/target-areas")
export class TargetAreasController {
  private targetAreaService = new TargetAreaService();

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const targetAreas = await this.targetAreaService.getAll(queries);
    return c.json(targetAreas);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const targetArea = await this.targetAreaService.create(body);
    return c.json(targetArea);
  }

  @Patch("/:id")
  async update(c: Context) {
    const body = await c.req.json();
    const id = c.req.param("id");

    const targetArea = await this.targetAreaService.update(id, body);
    return c.json(targetArea);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.targetAreaService.delete(id);
    return c.json({ success: true, id });
  }
}
