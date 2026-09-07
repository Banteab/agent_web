import { API_BASE_URL, API_KEY } from "../constants";
import { getToken } from "../storage";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  auth?: boolean;
  apiKey?: boolean;
  json?: unknown;
  form?: Record<string, string | number | undefined | null>;
  expectJson?: boolean;
};

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.apiKey) headers["x-api-key"] = API_KEY;
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  } else if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    const params = new URLSearchParams();
    Object.entries(options.form).forEach(([key, value]) => {
      params.append(key, value == null ? "" : String(value));
    });
    body = params;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  const contentType = res.headers.get("content-type") || "";
  const parsed = await parseBody(res);
  const envelope = parsed && typeof parsed === "object" ? (parsed as { success?: boolean; message?: string; error?: string }) : null;
  const failed = !res.ok || envelope?.success === false || contentType.includes("text/html");
  if (failed) {
    const message =
      (envelope?.message && String(envelope.message)) ||
      (envelope?.error && String(envelope.error)) ||
      (typeof parsed === "string" && parsed.startsWith("<") ? `Request failed (${res.status})` : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}
