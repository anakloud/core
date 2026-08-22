import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../lib/utils.ts";
import { CatalogError } from "../services/services.service.ts";
import { domainsService } from "./domains.service.ts";

function error(c: Context, cause: unknown) { return c.json({ error: cause instanceof Error ? cause.message : "Invalid request" }, (cause instanceof CatalogError ? cause.status : 400) as 400 | 404 | 409); }

@Controller("/domains")
export class DomainsController {
  @Get("") async getAll(c: Context) { try { return c.json(await domainsService.getAll(c.req.query("serviceId"), c.req.query("serviceCode"))); } catch (cause) { return error(c, cause); } }
  @Post("") async create(c: Context) { try { return c.json(await domainsService.create(await c.req.json()), 201); } catch (cause) { return error(c, cause); } }
  @Patch("/:id") async update(c: Context) { try { return c.json(await domainsService.update(c.req.param("id")!, await c.req.json())); } catch (cause) { return error(c, cause); } }
  @Delete("/:id") async delete(c: Context) { try { return c.json(await domainsService.delete(c.req.param("id")!)); } catch (cause) { return error(c, cause); } }
}
