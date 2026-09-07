export interface SendEmailInput {
  from?: string;
  to: string | string[];
  subject: string;
  templateHtml: string;
  variables?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compileTemplate(html: string, variables: Record<string, any> = {}): string {
  let compiled = html;
  const condRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  compiled = compiled.replace(condRegex, (_, key, content) => (variables[key] ? content : ""));
  const varRegex = /\{\{(\w+)\}\}/g;
  compiled = compiled.replace(varRegex, (_, key) =>
    variables[key] !== undefined ? escapeHtml(variables[key]) : "",
  );
  return compiled;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    console.warn("EMAIL_API_KEY is not defined. Skipping email dispatch.");
    return { success: false, error: "EMAIL_API_KEY is missing" };
  }

  try {
    const to = Array.isArray(input.to) ? input.to : [input.to];
    const html = compileTemplate(input.templateHtml, input.variables ?? {});
    const from = input.from || process.env.FROM_EMAIL || "Anakloud <noreply@mail.anakloud.com>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject: input.subject, html }),
    });

    const data = (await response.json()) as any;
    if (!response.ok) {
      throw new Error(data?.message || `Resend API Error HTTP ${response.status}`);
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("sendEmail error:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
