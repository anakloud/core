import axios from "axios";

declare const __DEV__: boolean;

export interface ApiClientOptions {
  port: number;
  baseURL?: string;
  hostUri?: string;
}

export function createApiClient({ port, baseURL, hostUri }: ApiClientOptions) {
  const runtimeLocation = (globalThis as { location?: { hostname?: string } }).location;
  const devIP =
    hostUri?.split(":")[0] ||
    runtimeLocation?.hostname;
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  const apiUrl =
    (baseURL ?? process.env["EXPO_PUBLIC_API_URL"])?.replace(/\/+$/, "") ||
    (isDev && devIP
      ? `http://${devIP}:${port}`
      : `http://localhost:${port}`);

  return axios.create({
    baseURL: apiUrl,
    withCredentials: true,
  });
}
