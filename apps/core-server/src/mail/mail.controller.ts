import type { Context } from "hono";
import { Controller, Post } from "../lib/decorators.ts";
import { mailService } from "./mail.service.ts";

@Controller("/mail")
export class MailController {
  @Post("/send")
  async sendEmail(c: Context) {
    try {
      const body = await c.req.json();
      const result = await mailService.sendEmail(body);
      return c.json(result);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Post("/send-template")
  async sendTemplateEmail(c: Context) {
    try {
      const body = await c.req.json();
      const result = await mailService.sendTemplateEmail(body);
      return c.json(result);
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }
}
