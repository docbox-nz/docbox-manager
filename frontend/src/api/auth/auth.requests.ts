import { httpGet, httpPost } from "../axios";
import type { IsAuthenticatedResponse } from "./auth.types";

export function isAuthenticated() {
  return httpGet<IsAuthenticatedResponse>("/auth/is-authenticated");
}

export function authenticate(password: string) {
  return httpPost<{}>("/auth/authenticate", { password });
}

export function logout() {
  return httpPost<{}>("/auth/logout");
}
