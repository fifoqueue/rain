import { fileExists, readFile, writeFile } from "@api/native/fs";

const LOG_FILE = "public/message_logs.json";
const MAX_LOGS = 1000;
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(write: () => Promise<void>): Promise<void> {
    const result = writeQueue.then(write);
    writeQueue = result.catch(() => {});
    return result;
}

export interface MessageLogEntry {
    timestamp: string;
    type: "DELETE" | "UPDATE";
    messageId: string;
    channelId: string;
    author: {
        id: string;
        username: string;
        discriminator: string;
        bot: boolean;
    };
    content: string;
    attachments: string[];
}

interface LogData {
    version: number;
    logs: MessageLogEntry[];
}

async function writeLogData(data: LogData): Promise<void> {
    const content = JSON.stringify(data);
    await writeFile(LOG_FILE, content);
}

async function readLogData(): Promise<LogData> {
    const exists = await fileExists(LOG_FILE);
    if (!exists) return { version: 1, logs: [] };

    const content = await readFile(LOG_FILE);
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
        return { version: 1, logs: parsed };
    }

    if (parsed?.version === 1 && Array.isArray(parsed.logs)) return parsed;
    throw new Error("Invalid message log format; existing data was preserved");
}

export function addLogEntry(entry: MessageLogEntry): Promise<void> {
    return enqueueWrite(async () => {
        const data = await readLogData();

        if (data.logs.length >= MAX_LOGS) data.logs.shift();

        data.logs.push(entry);
        await writeLogData(data);
    });
}

export async function getLogEntries(
    filter?: {
        channelId?: string;
        authorId?: string;
        type?: "DELETE" | "UPDATE";
    },
    limit = 100
): Promise<MessageLogEntry[]> {
    await writeQueue;
    const data = await readLogData();
    let entries = data.logs;

    if (filter?.channelId) {
        entries = entries.filter(e => e.channelId === filter.channelId);
    }
    if (filter?.authorId) {
        entries = entries.filter(e => e.author.id === filter.authorId);
    }
    if (filter?.type) {
        entries = entries.filter(e => e.type === filter.type);
    }

    return entries.slice(-limit);
}

export async function getLogEntry(messageId: string): Promise<MessageLogEntry | null> {
    await writeQueue;
    const data = await readLogData();
    return data.logs.find(e => e.messageId === messageId) ?? null;
}

export async function clearLogs(): Promise<void> {
    await enqueueWrite(() => writeLogData({ version: 1, logs: [] }));
}
