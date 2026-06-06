// Generic REST client for the survey-ops-plus backend (routes under /api/v1).

import { API_PREFIX, BASE_URL } from "./constants";
import { RestError } from "@/rest/rest-error";
import { parseJsonSafe } from "@/utils/parse-json-safe";

// ─── Types ─────────────────────────────────────────────────────

/** HTTP verbs exposed on the generic client; extend when new call sites need them. */
export enum RestMethod {
    Get = "GET",
    Post = "POST",
}

export type ApiRequestOptions = {
    method?: RestMethod | null;
    body?: BodyInit;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;

function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    return `${BASE_URL}${API_PREFIX}${normalizedPath}`;
}

function createTimeoutAbortController(
    options: Pick<ApiRequestOptions, "signal" | "timeoutMs">,
): { controller: AbortController; cleanup: () => void } {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const externalSignal = options.signal;
    let detachAbortListener: (() => void) | null = null;

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            const onAbort = () => {
                controller.abort();
                externalSignal.removeEventListener("abort", onAbort);
            };
            externalSignal.addEventListener("abort", onAbort);
            detachAbortListener = () => {
                externalSignal.removeEventListener("abort", onAbort);
            };
        }
    }

    return {
        controller,
        cleanup: () => {
            clearTimeout(timeoutId);
            detachAbortListener?.();
        },
    };
}

// True when `body` should be JSON.stringify'd (plain object), not FormData or ArrayBuffer.
function isPlainObjectBodyForJson(body: BodyInit | undefined): boolean {
    if (body === undefined) return false;
    if (typeof FormData !== "undefined" && body instanceof FormData) return false;
    if (typeof body !== "object" || body === null) return false;
    if (body instanceof ArrayBuffer) return false;
    return true;
}

// ─── Generic helper ─────────────────────────────────────────────

// Shared fetch to {BASE_URL}/api{path}; `method` is a string so POST/etc. stay internal until needed on the public API.
async function requestWithMethod<T = unknown>(
    path: string,
    method: string,
    options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
    const response = await requestWithMethodRaw(path, method, options);
    const rawText = await response.text();
    const parsed = parseJsonSafe(rawText);
    return (parsed as T) ?? (rawText as unknown as T);
}

async function requestWithMethodRaw(
    path: string,
    method: string,
    options: Omit<ApiRequestOptions, "method"> = {},
): Promise<Response> {
    const url = buildApiUrl(path);
    const headers: Record<string, string> = { ...options.headers };
    let body: BodyInit | undefined = options.body;

    if (isPlainObjectBodyForJson(body)) {
        body = JSON.stringify(body);
        if (!headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }
    }

    const { controller, cleanup } = createTimeoutAbortController(options);

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
        });

        if (!response.ok) {
            const rawText = await response.text();
            const parsed = parseJsonSafe(rawText);
            throw new RestError(
                `REST ${method} ${url} failed with status ${response.status}`,
                response.status,
                parsed ?? rawText,
            );
        }

        return response;
    } finally {
        cleanup();
    }
}

// Generic REST wrapper; callers must pass a truthy `method` (e.g. RestMethod.Get). POST bodies use `apiPostRequest` from `data/*` DAOs.
export async function apiRequest<T = unknown>(
    path: string,
    options: ApiRequestOptions,
): Promise<T> {
    const { method, ...rest } = options;
    if (!method) {
        throw new Error(
            "apiRequest: `options.method` must be a non-empty verb (e.g. RestMethod.Get); got a falsy value",
        );
    }
    return requestWithMethod<T>(path, method, rest);
}

export async function apiRequestRaw(
    path: string,
    options: ApiRequestOptions,
): Promise<Response> {
    const { method, ...rest } = options;
    if (!method) {
        throw new Error(
            "apiRequestRaw: `options.method` must be a non-empty verb (e.g. RestMethod.Get); got a falsy value",
        );
    }
    return requestWithMethodRaw(path, method, rest);
}

export type ApiPostRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

// POST with an explicit body (e.g. FormData); used by `data/*` DAOs for backend calls.
export async function apiPostRequest<T = unknown>(
    path: string,
    body: BodyInit,
    options: ApiPostRequestOptions = {},
): Promise<T> {
    return requestWithMethod<T>(path, "POST", { ...options, body });
}
