import axios, { type AxiosInstance } from "axios";

declare const __DEV__: boolean;

export interface ApiClientOptions {
  /** Port for auto-detected dev URL (ignored if baseURL is provided) */
  port?: number;
  /** Base URL - if provided, skips auto-detection */
  baseURL?: string;
  /** Expo hostUri for dev IP detection */
  hostUri?: string;
}

export function createApiClient({
  port,
  baseURL,
  hostUri,
}: ApiClientOptions): AxiosInstance {
  let apiUrl: string;

  if (baseURL) {
    apiUrl = baseURL.replace(/\/+$/, "");
  } else {
    const runtimeLocation = (globalThis as { location?: { hostname?: string } })
      .location;
    const devIP = hostUri?.split(":")[0] || runtimeLocation?.hostname;
    const isDev = typeof __DEV__ !== "undefined" && __DEV__;
    const envUrl = process.env["EXPO_PUBLIC_API_URL"]?.replace(/\/+$/, "");

    apiUrl =
      envUrl ||
      (isDev && devIP && port
        ? `http://${devIP}:${port}`
        : port
          ? `http://localhost:${port}`
          : "");
  }

  return axios.create({
    baseURL: apiUrl,
    withCredentials: true,
  });
}
