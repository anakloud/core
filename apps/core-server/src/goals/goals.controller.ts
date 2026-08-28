import type { Context } from "hono";
import { Controller, Delete, Get, Patch, Post } from "../utils.ts";
import { GoalService } from "./goal.service.ts";

@Controller("/goals")
export class GoalsController {
  private goalService = new GoalService();

  @Get()
  async getAll(c: Context) {
    const queries = c.req.query();
    const goals = await this.goalService.getAll(queries);
    return c.json(goals);
  }

  @Post()
  async create(c: Context) {
    const body = await c.req.json();
    const goal = await this.goalService.create(body);
    return c.json(goal);
  }

  @Patch("/:id")
  async update(c: Context) {
    const body = await c.req.json();
    const id = c.req.param("id");
    const goal = await this.goalService.update(id, body);
    return c.json(goal);
  }

  @Delete("/:id")
  async delete(c: Context) {
    const id = c.req.param("id");
    await this.goalService.delete(id);
    return c.json({ success: true, id });
  }
}
