import { httpGet, httpPost } from "../axios";
import type { IsInitializedResponse } from "./root.types";

export function isInitialized() {
  return httpGet<IsInitializedResponse>("/root/initialized");
}

export function initializeRoot() {
  return httpPost("/root/initialize");
}
