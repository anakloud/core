import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { MailInputError, MailService } from "./mail.service.ts";

const originalFetch = globalThis.fetch;

describe("MailService", () => {
  beforeEach(() => {
    process.env["RESEND_API_KEY"] = "test-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("rejects invalid recipients before calling Resend", async () => {
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response();
    }) as unknown as typeof fetch;

    await expect(new MailService().sendEmail({
      to: "not-an-email",
      subject: "Subject",
      text: "Body",
    })).rejects.toBeInstanceOf(MailInputError);
    expect(called).toBe(false);
  });

  test("sends a bounded valid payload", async () => {
    let body: any;
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ id: "email-1" });
    }) as unknown as typeof fetch;

    await expect(new MailService().sendEmail({
      to: " parent@example.com ",
      subject: " Verify your email ",
      html: "<p>Verify</p>",
    })).resolves.toEqual({ success: true, id: "email-1" });
    expect(body).toMatchObject({
      to: ["parent@example.com"],
      subject: "Verify your email",
    });
  });

  test("escapes template variables before inserting them into HTML", async () => {
    let body: any;
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ id: "email-2" });
    }) as unknown as typeof fetch;
    await new MailService().sendTemplateEmail({
      to: "parent@example.com",
      subject: "Verify",
      templateHtml: "<p>Hello {{name}}</p>",
      variables: { name: '<script>alert("x")</script>' },
    });
    expect(body.html).toContain("&lt;script&gt;");
    expect(body.html).not.toContain("<script>");
  });
});
