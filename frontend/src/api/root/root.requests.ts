import { httpGet, httpPost } from "../axios";
import type { IsInitializedResponse, MigrationsResponse } from "./root.types";

export function isInitialized() {
  return httpGet<IsInitializedResponse>("/root/initialized");
}

export function getMigrations() {
  return httpGet<MigrationsResponse>("/root/migrations");
}

export function initializeRoot() {
  return httpPost("/root/initialize");
}

export function migrateTenants() {
  return httpPost(`/root/migrate`, { skip_failed: true });
}
