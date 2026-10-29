import { createRequire } from "node:module";

import { expect, test } from "bun:test";
import React from "react";

import { getComponentPatchTarget } from "./patchTarget";

test("patches a memo function through its owner and restores it", () => {
    const { after } = createRequire(import.meta.url)("sublimation/dist/index.js");
    const render = (props: { text: string }) => props.text;
    const module = { default: React.memo(render) };
    const unpatch = after(...getComponentPatchTarget(module, "default"), (_args: unknown[], result: string) => result.toUpperCase());

    expect(module.default.type({ text: "message" })).toBe("MESSAGE");
    unpatch();
    expect(module.default.type).toBe(render);
});
