import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import { ComponentService } from "./component.service.ts";

@Controller("/components")
export class ComponentsController {
  private componentService = new ComponentService();

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const components = await this.componentService.getAll(queries);
    return c.json(components);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const component = await this.componentService.create(body);
    return c.json(component);
  }

  @Patch("/:id")
  async update(c: Context) {
    const body = await c.req.json();
    const id = c.req.param("id");
    const component = await this.componentService.update(id, body);
    return c.json(component);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.componentService.delete(id);
    return c.json({ success: true, id });
  }
}
