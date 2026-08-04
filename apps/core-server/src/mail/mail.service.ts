export interface SendMailInput {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface SendTemplateMailInput {
  from?: string;
  to: string | string[];
  subject: string;
  templateHtml: string;
  variables?: Record<string, any>;
}

export class MailInputError extends Error {}

const MAX_RECIPIENTS = 10;
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 50_000;

function recipients(value: string | string[]): string[] {
  const items = Array.isArray(value) ? value : [value];
  if (items.length < 1 || items.length > MAX_RECIPIENTS) {
    throw new MailInputError(`Email must have between 1 and ${MAX_RECIPIENTS} recipients`);
  }
  const normalized = items.map((item) => item.trim());
  if (normalized.some((item) => !/^\S+@\S+\.\S+$/.test(item))) {
    throw new MailInputError("Email contains an invalid recipient");
  }
  return normalized;
}

function validateCommon(input: SendMailInput) {
  if (!input || typeof input !== "object") throw new MailInputError("Invalid email request");
  const to = recipients(input.to);
  const subject = input.subject?.trim();
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    throw new MailInputError(`Subject must be between 1 and ${MAX_SUBJECT_LENGTH} characters`);
  }
  if (!input.html && !input.text) throw new MailInputError("Email body is required");
  if ((input.html?.length ?? 0) > MAX_BODY_LENGTH || (input.text?.length ?? 0) > MAX_BODY_LENGTH) {
    throw new MailInputError("Email body is too large");
  }
  return { to, subject };
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class MailService {
  private getApiKey(): string {
    const key = process.env["RESEND_API_KEY"];
    if (!key) {
      throw new Error("RESEND_API_KEY is missing from environment variables");
    }
    return key;
  }

  private compileTemplate(html: string, variables: Record<string, any> = {}): string {
    let compiled = html;
    // Handle {{#if var}}...{{/if}}
    const condRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    compiled = compiled.replace(condRegex, (_, key, content) => (variables[key] ? content : ""));

    // Handle {{variable}}
    const varRegex = /\{\{(\w+)\}\}/g;
    compiled = compiled.replace(varRegex, (_, key) =>
      variables[key] !== undefined ? escapeHtml(variables[key]) : "",
    );

    return compiled;
  }

  async sendEmail(input: SendMailInput) {
    const apiKey = this.getApiKey();
    const validated = validateCommon(input);
    const defaultFrom = process.env["RESEND_FROM_EMAIL"] || "Anakloud <noreply@mail.anakloud.com>";

    const payload = {
      from: input.from || defaultFrom,
      to: validated.to,
      subject: validated.subject,
      ...(input.html ? { html: input.html } : {}),
      ...(input.text ? { text: input.text } : {}),
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      throw new Error(data?.message || `Resend API Error HTTP ${res.status}`);
    }

    return { success: true, id: data?.id };
  }

  async sendTemplateEmail(input: SendTemplateMailInput) {
    if (!input || typeof input !== "object" || typeof input.templateHtml !== "string") {
      throw new MailInputError("Invalid template email request");
    }
    if (input.templateHtml.length > MAX_BODY_LENGTH) {
      throw new MailInputError("Email template is too large");
    }
    const compiledHtml = this.compileTemplate(input.templateHtml, input.variables ?? {});
    return this.sendEmail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: compiledHtml,
    });
  }
}

export const mailService = new MailService();
