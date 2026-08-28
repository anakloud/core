import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import { SubAreaService } from "./sub-area.service.ts";

@Controller("/sub-areas")
export class SubAreasController {
  private subAreaService = new SubAreaService();

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const subAreas = await this.subAreaService.getAll(queries);
    return c.json(subAreas);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const subArea = await this.subAreaService.create(body);
    return c.json(subArea);
  }

  @Patch("/:id")
  async update(c: Context) {
    const body = await c.req.json();
    const id = c.req.param("id");
    const subArea = await this.subAreaService.update(id, body);
    return c.json(subArea);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.subAreaService.delete(id);
    return c.json({ success: true, id });
  }
}
