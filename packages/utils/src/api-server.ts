/**
 * Server-side API client using native fetch.
 * Use this for backend-to-backend HTTP communication.
 *
 * For frontend API clients (React Native/Expo), use createApiClient instead.
 */
export abstract class ApiServer {
  protected abstract baseUrl: string;
  protected abstract serviceName: string;
  protected abstract getHeaders: () => Record<string, string>;

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...this.getHeaders(),
        ...init.headers,
      },
    });

    const text = await response.text();

    if (!text) {
      if (response.ok) return undefined as T;
      throw new ApiRequestError(
        `${this.serviceName} request failed (${response.status})`,
        response.status,
      );
    }

    let payload: any = null;
    try {
      payload = JSON.parse(text);
    } catch {
      if (!response.ok) throw new ApiRequestError(text, response.status);
      throw new ApiRequestError(
        `${this.serviceName} returned an invalid response`,
        502,
      );
    }

    if (!response.ok) {
      throw new ApiRequestError(
        payload?.error ||
          payload?.message ||
          `${this.serviceName} request failed (${response.status})`,
        response.status,
      );
    }
    return payload as T;
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
