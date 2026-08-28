import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post, Public } from "../utils.ts";
import { CenterService } from "./center.service.ts";

@Controller("/centers")
export class CentersController {
  private readonly centerService = new CenterService();

  @Get()
  async getAll(c: Context) {
    const centers = await this.centerService.getAll();
    return c.json(centers);
  }

  @Get("/:namespace")
  @Public()
  async getByNamespace(c: Context) {
    const namespace = c.req.param("namespace");
    const center = await this.centerService.getByNamespace(namespace);
    return c.json(center);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const center = await this.centerService.create(body);
    return c.json(center);
  }

  @Patch("/:id")
  async update(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const center = await this.centerService.update(id, body);
    return c.json(center);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.centerService.delete(id);
    return c.json({ success: true, id });
  }
}
