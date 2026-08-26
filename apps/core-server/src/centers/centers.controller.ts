import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../lib/utils.ts";
import { CenterError, centersService } from "./centers.service.ts";

function error(c: Context, cause: unknown) {
  const status = (cause instanceof CenterError ? cause.status : 400) as 400 | 404 | 409;
  return c.json({ error: cause instanceof Error ? cause.message : "Invalid request" }, status);
}

@Controller("/centers")
export class CentersController {
  @Get("")
  async list(c: Context) {
    try { return c.json(await centersService.list()); } catch (cause) { return error(c, cause); }
  }

  @Get("/:namespace")
  async get(c: Context) {
    try { return c.json(await centersService.getByNamespace(c.req.param("namespace")!)); } catch (cause) { return error(c, cause); }
  }

  @Get("/:id/integration")
  async integration(c: Context) {
    try { return c.json(await centersService.get(c.req.param("id")!)); } catch (cause) { return error(c, cause); }
  }

  @Post("")
  async create(c: Context) {
    try { return c.json(await centersService.create(await c.req.json()), 201); } catch (cause) { return error(c, cause); }
  }

  @Patch("/:id")
  async update(c: Context) {
    try { return c.json(await centersService.update(c.req.param("id")!, await c.req.json())); } catch (cause) { return error(c, cause); }
  }

  @Delete("/:id")
  async delete(c: Context) {
    try { return c.json(await centersService.delete(c.req.param("id")!)); } catch (cause) { return error(c, cause); }
  }
}
