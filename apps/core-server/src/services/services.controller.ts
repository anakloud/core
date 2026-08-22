import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../lib/utils.ts";
import { CatalogError, servicesService } from "./services.service.ts";

function error(c: Context, cause: unknown) {
  const status = (cause instanceof CatalogError ? cause.status : 400) as 400 | 404 | 409;
  const message = cause instanceof Error ? cause.message : "Invalid request";
  return c.json({ error: message }, status);
}

function booleanQuery(value: string | undefined) {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new CatalogError("isActive must be true or false");
}

@Controller("/services")
export class ServicesController {
  @Get("")
  async getAll(c: Context) {
    try { return c.json(await servicesService.getAll(booleanQuery(c.req.query("isActive")))); }
    catch (cause) { return error(c, cause); }
  }

  @Get("/:id")
  async getById(c: Context) {
    try { return c.json(await servicesService.getById(c.req.param("id")!)); }
    catch (cause) { return error(c, cause); }
  }

  @Post("")
  async create(c: Context) {
    try { return c.json(await servicesService.create(await c.req.json()), 201); }
    catch (cause) { return error(c, cause); }
  }

  @Patch("/:id")
  async update(c: Context) {
    try { return c.json(await servicesService.update(c.req.param("id")!, await c.req.json())); }
    catch (cause) { return error(c, cause); }
  }

  @Delete("/:id")
  async delete(c: Context) {
    try { return c.json(await servicesService.delete(c.req.param("id")!)); }
    catch (cause) { return error(c, cause); }
  }
}
