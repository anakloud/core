/**
 * @anakloud/messages
 *
 * @example
 * ```typescript
 * await publish('child.update', data, { to: ['center-1', 'center-2'] });
 * await consume('child.update', async (payload) => { ... }, { id: 'center-1' });
 * ```
 */
import amqplib, { type ChannelModel, type Channel } from "amqplib";

export interface ConsumeOptions {
  id: string;
  maxRetries?: number;
  retryDelayMs?: number;
  deadLetter?: boolean;
}

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqplib.connect(process.env.RABBITMQ_URL!);

  connection.on("error", (err) => {
    console.error("[Messages] Connection error:", err);
    channel = null;
    connection = null;
  });

  connection.on("close", () => {
    console.error("[Messages] Connection closed");
    channel = null;
    connection = null;
  });

  channel = await connection.createChannel();
  await channel.prefetch(1);

  return channel;
}

export async function publish(
  exchange: string,
  payload: unknown,
  options: { to: string[] }
): Promise<void> {
  const ch = await getChannel();

  await ch.assertExchange(exchange, "headers", { durable: true });

  const headers: Record<string, boolean> = {};
  for (const id of options.to) {
    headers[id] = true;
  }

  ch.publish(exchange, "", Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    headers,
  });
}

export async function consume(
  exchange: string,
  handler: (payload: unknown) => Promise<void>,
  options: ConsumeOptions
): Promise<void> {
  const { id, maxRetries = 3, retryDelayMs = 5000, deadLetter = true } = options;

  const ch = await getChannel();
  const queue = `${id}.${exchange}`;
  const dlq = `${queue}.dlq`;

  await ch.assertExchange(exchange, "headers", { durable: true });
  await ch.assertQueue(queue, { durable: true });
  if (deadLetter) await ch.assertQueue(dlq, { durable: true });

  await ch.bindQueue(queue, exchange, "", { [id]: true, "x-match": "any" });

  console.log(`[Messages] Consuming ${exchange} as ${id}`);

  ch.consume(queue, async (msg) => {
    if (!msg) return;

    const retries = (msg.properties.headers?.["x-retries"] as number) ?? 0;

    try {
      await handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[Messages] Error (${retries + 1}/${maxRetries + 1}): ${error}`);

      if (retries < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        ch.publish(exchange, "", msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retries": retries + 1 },
        });
      } else if (deadLetter) {
        ch.sendToQueue(dlq, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": error },
        });
        console.error(`[Messages] Sent to DLQ: ${dlq}`);
      }

      ch.ack(msg);
    }
  });
}
