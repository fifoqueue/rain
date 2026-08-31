import { NativeFileModule } from "@api/native/modules";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";

interface ParsedDataUrl {
    body: string;
    isBase64: boolean;
    mime: string;
}

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) return null;

    const meta = dataUrl.slice(5, commaIndex);
    const body = dataUrl.slice(commaIndex + 1);
    const isBase64 = meta.includes(";base64");
    const mime = (meta.split(";")[0] || "image/png").trim() || "image/png";

    return { body, isBase64, mime };
}

function scheduleCacheCleanup(tempPath: string, delayMs: number) {
    setTimeout(() => {
        try {
            const maybePromise = NativeFileModule.removeFile("cache", tempPath);
            (maybePromise as any)?.catch?.(() => { });
        } catch { }
    }, delayMs);
}

function getApiBase(): string {
    try {
        let base = findByProps("getAPIBaseURL", "del")?.getAPIBaseURL?.();
        if (typeof base === "string") {
            if (base.startsWith("//")) base = `https:${base}`;
            // Only trust values that already include the API path segment —
            // a bare origin would send the message POST to the wrong route.
            if (base.startsWith("http") && base.includes("/api/")) return base;
        }
    } catch { }
    return "https://discord.com/api/v9";
}

/**
 * Posts the message with the file straight to Discord's own REST API as
 * multipart form data. Uses React Native's FormData file part mechanism and
 * keeps the upload first-party: the file goes only to Discord's CDN.
 */
async function sendViaRestApi(channelId: string, uri: string, filename: string, mime: string): Promise<void> {
    const token = findByProps("getToken")?.getToken?.();
    if (!token) throw new Error("Unable to resolve authorization token.");

    const form = new FormData();
    form.append("payload_json", JSON.stringify({
        content: "",
        channel_id: channelId,
        type: 0,
        sticker_ids: [],
        attachments: [{ id: "0", filename }],
        nonce: Date.now().toString(),
    }));
    form.append("files[0]", { uri, type: mime, name: filename } as any);

    // Generous cap for a multipart image upload on slow mobile networks;
    // without it a stalled send would never surface a toast.
    const controller = typeof AbortController === "function" ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), 60_000) : undefined;

    let response: Response;
    try {
        response = await fetch(`${getApiBase()}/channels/${channelId}/messages`, {
            method: "POST",
            headers: { Authorization: token },
            body: form,
            signal: controller?.signal,
        });
    } catch (error) {
        const aborted = (error as any)?.name === "AbortError";
        throw aborted ? new Error("Upload timed out.") : error;
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        logger.error("[Quoter] REST upload failed:", response.status, text);
        throw new Error(`Discord API returned ${response.status}`);
    }
}

/**
 * Sends a rendered quote data URL as a native Discord attachment: writes the
 * PNG to the app cache and hands it to Discord — no third-party host is
 * involved.
 *
 * Note: bypassuploadlimit patches CloudUpload and reroutes uploads above 8 MB
 * (or all of them with "alwaysUpload") to an external host; quote PNGs stay
 * far below that threshold, and the REST path bypasses CloudUpload entirely.
 */
export async function sendQuoteAttachment(channelId: string, dataUrl: string, filename: string): Promise<void> {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed?.isBase64 || !parsed.body) {
        throw new Error("Invalid rendered quote image.");
    }

    const tempPath = `rain/quoter/${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    const filePath = await NativeFileModule.writeFile("cache", tempPath, parsed.body, "base64");
    const uri = String(filePath).startsWith("file://") ? String(filePath) : `file://${filePath}`;

    try {
        await sendViaRestApi(channelId, uri, filename, parsed.mime);
    } finally {
        // The response resolves after Discord has consumed the request body.
        scheduleCacheCleanup(tempPath, 3_000);
    }
}
