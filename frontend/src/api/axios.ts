import axios, { isAxiosError, type AxiosRequestConfig } from "axios";

export const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? `${window.location.origin}/api/`;

// Status codes to exclude from request retry
export const RETRY_EXCLUDE_STATUS = [400, 401, 403, 404];

export const axiosInstance = axios.create({
  baseURL: SERVER_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export async function httpGet<T = any, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
) {
  const { data } = await axiosInstance.get<T>(url, config);
  return data;
}

export async function httpPost<T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
) {
  const { data: responseData } = await axiosInstance.post<T>(url, data, config);
  return responseData;
}

export async function httpPut<T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
) {
  const { data: responseData } = await axiosInstance.put<T>(url, data, config);
  return responseData;
}

export async function httpPatch<T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
) {
  const { data: responseData } = await axiosInstance.patch<T>(
    url,
    data,
    config
  );
  return responseData;
}

export async function httpDelete<T = any, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
) {
  const { data: responseData } = await axiosInstance.delete<T>(url, config);
  return responseData;
}

export function getAPIErrorMessage(error: any): string {
  const message = getAPIErrorMessageInner(error);
  if (message === "null") {
    return "Something went wrong";
  }

  if (message === "Network Error") {
    return "Service unavailable, unreachable, or timed out";
  }

  return message;
}

function getAPIErrorMessageInner(error: any): string {
  if (isAxiosError(error)) {
    if (error.response && error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response && error.response.data && error.response.data.reason) {
      return error.response.data.reason;
    }

    if (error.response && typeof error.response.data === "string") {
      return error.response.data;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}
