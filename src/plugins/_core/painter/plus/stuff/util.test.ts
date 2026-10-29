import { expect, mock, test } from "bun:test";

test("uses the persisted iconpack cache when fetching fails", async () => {
    const cache = { iconpacks: { "https://example.com/icons": "cached icons" }, setIconpack: mock() };
    mock.module("..", () => ({ vstorage: {} }));
    mock.module("../stores/CacheStore", () => ({ useCacheStore: { getState: () => cache } }));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() => Promise.reject(new Error("offline"))) as any;
    try {
        const { cFetch } = await import("./util");
        expect(await cFetch("https://example.com/icons")).toBe("cached icons");
    } finally {
        globalThis.fetch = originalFetch;
    }
});
