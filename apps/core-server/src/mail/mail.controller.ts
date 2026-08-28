import type { Context } from "hono";
import { Controller, Post } from "../utils.ts";
import { MailInputError, mailService } from "./mail.service.ts";

const MAX_REQUEST_BYTES = 64 * 1024;

function requestTooLarge(c: Context) {
  const length = Number(c.req.header("content-length") ?? 0);
  return Number.isFinite(length) && length > MAX_REQUEST_BYTES;
}

function mailError(c: Context, error: unknown) {
  if (error instanceof MailInputError) {
    return c.json({ success: false, error: error.message }, 400);
  }
  console.error("Core mail delivery failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return c.json({ success: false, error: "Email delivery failed" }, 502);
}

@Controller("/mail")
export class MailController {
  @Post("/send")
  async sendEmail(c: Context) {
    if (requestTooLarge(c)) return c.json({ success: false, error: "Request is too large" }, 413);
    try {
      const body = await c.req.json();
      const result = await mailService.sendEmail(body);
      return c.json(result);
    } catch (error) {
      return mailError(c, error);
    }
  }

  @Post("/send-template")
  async sendTemplateEmail(c: Context) {
    if (requestTooLarge(c)) return c.json({ success: false, error: "Request is too large" }, 413);
    try {
      const body = await c.req.json();
      const result = await mailService.sendTemplateEmail(body);
      return c.json(result);
    } catch (error) {
      return mailError(c, error);
    }
  }
}
