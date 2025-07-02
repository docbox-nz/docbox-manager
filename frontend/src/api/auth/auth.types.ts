export interface IsAuthenticatedResponse {
  authenticated: boolean;
}

export interface AuthenticateRequest {
  password: string;
}
