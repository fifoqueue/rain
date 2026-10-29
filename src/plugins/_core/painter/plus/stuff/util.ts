import { vstorage } from "..";
import { useCacheStore } from "../stores/CacheStore";

export function customUrl() {
    const { url } = vstorage.iconpack.custom;
    return url.length > 1 ? (!url.endsWith("/") ? `${url}/` : url) : "";
}

export function fixPath(path: string) {
    return path.startsWith("../") ? `_/${path.slice(3)}` : path;
}
export function flattenFilePath(path: string) {
    return path.replace(/[\\/]/g, "_").replace(/-/g, "");
}

export function cFetch(
	url: RequestInfo,
	init?: RequestInit,
	format?: "text",
): Promise<string>;
export function cFetch<JsonType>(
	url: RequestInfo,
	init?: RequestInit,
	format?: "json",
): Promise<JsonType>;

export async function cFetch(
    url: RequestInfo,
    init?: RequestInit,
    format = "text",
) {
    const cache = useCacheStore.getState();
    const rawUrl = typeof url === "string" ? url : url.url;

    let ret: string;
    try {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`Failed to fetch ${rawUrl}: ${res.status}`);
        ret = await res.text();
        if (format === "json") JSON.parse(ret);
        cache.setIconpack(rawUrl, ret);
    } catch (error) {
        if (typeof cache.iconpacks[rawUrl] !== "string") throw error;
        ret = cache.iconpacks[rawUrl];
    }

    if (format === "json") return JSON.parse(ret);
    return ret;
}
