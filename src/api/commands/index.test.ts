import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("registers commands before built-ins load and catches synchronous execution failures", async () => {
    const error = mock();
    mock.module("@lib/utils/logger", () => ({ logger: { error } }));
    mock.module("@metro/common", () => ({ commands: { getBuiltInCommands: () => [] }, messageUtil: { sendMessage: mock() } }));
    const { registerCommand } = await import("./index");
    const command: any = { name: "test", description: "test", execute() { throw new Error("command failed"); } };
    const unregister = registerCommand(command);
    expect(command.id).toBe("-2");
    await command.execute([], { channel: { id: "channel" } });
    expect(error).toHaveBeenCalledTimes(1);
    unregister();
});
