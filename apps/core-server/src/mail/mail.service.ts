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
      variables[key] !== undefined ? String(variables[key]) : "",
    );

    return compiled;
  }

  async sendEmail(input: SendMailInput) {
    const apiKey = this.getApiKey();
    const defaultFrom = process.env["RESEND_FROM_EMAIL"] || "Anakloud <noreply@mail.anakloud.com>";

    const payload = {
      from: input.from || defaultFrom,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
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
