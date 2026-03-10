import fs from "fs";
import path from "path";

const DLQ_PATH = path.resolve(process.cwd(), "dlq.json");

const readDlq = (): any[] => {
  try {
    if (!fs.existsSync(DLQ_PATH)) return [];
    const content = fs.readFileSync(DLQ_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
};

const writeDlq = (messages: any[]): void => {
  fs.writeFileSync(DLQ_PATH, JSON.stringify(messages, null, 2), "utf-8");
};

const push = (message: any): void => {
  const messages = readDlq();
  messages.push({ ...message, _dlqTimestamp: new Date().toISOString() });
  writeDlq(messages);
  console.warn(`[DLQ] Message sauvegardé (total: ${messages.length})`);
};

const flush = async (
  handler: (message: any) => Promise<void>
): Promise<void> => {
  const messages = readDlq();
  if (messages.length === 0) return;
  console.log(`[DLQ] ${messages.length} message(s) à retraiter...`);
  const failed: any[] = [];
  for (const message of messages) {
    try {
      const { _dlqTimestamp: _, ...original } = message;
      await handler(original);
    } catch {
      failed.push(message);
    }
  }
  writeDlq(failed);
  console.log(
    `[DLQ] Retraitement terminé — ${messages.length - failed.length} ok, ${
      failed.length
    } encore en échec`
  );
};

export { push, flush };
