import { SERVER_BASE_URL } from "@/api/axios";
import { DocboxClient } from "@docbox-nz/docbox-sdk";
import axios from "axios";
import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

interface DocboxContextType {
  baseURL: string;
  client: DocboxClient;
}

export type DocboxClientExt = DocboxClient & {
  __unique_tenant_key: string;
};

const DocboxContext = createContext<DocboxContextType>(null!);

export function useDocboxClient() {
  const context = useContext(DocboxContext);
  return context.client;
}

export function useDocboxEndpoint() {
  const context = useContext(DocboxContext);
  return (endpoint: string) => {
    return `${context.baseURL}/${endpoint}`;
  };
}

type Props = PropsWithChildren<{
  env: string;
  tenantId: string;
}>;

export default function DocboxProvider({ env, tenantId, children }: Props) {
  const value: DocboxContextType = useMemo(() => {
    let baseURL = SERVER_BASE_URL;
    if (!baseURL.endsWith("/")) baseURL += "/";
    baseURL += `tenant/${env}/${tenantId}/gateway`;

    const axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    const docbox = new DocboxClient(axiosInstance);
    const client = Object.assign(docbox, {
      __unique_tenant_key: `${env}-${tenantId}`,
    });

    return { baseURL, client };
  }, [env, tenantId]);

  return (
    <DocboxContext.Provider value={value}>{children}</DocboxContext.Provider>
  );
}
