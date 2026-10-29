import { expect, mock, test } from "bun:test";

test("concurrent message log writes preserve the existing structured log", async () => {
    let contents = JSON.stringify({ version: 1, logs: [{ messageId: "existing" }] });
    mock.module("@api/native/fs", () => ({
        fileExists: async () => true,
        readFile: async () => contents,
        writeFile: async (_path: string, value: string) => { contents = value; },
    }));
    const { addLogEntry, getLogEntries } = await import("./database");
    await Promise.all([
        addLogEntry({ messageId: "first" } as any),
        addLogEntry({ messageId: "second" } as any),
    ]);
    expect((await getLogEntries()).map(entry => entry.messageId)).toEqual(["existing", "first", "second"]);
});
