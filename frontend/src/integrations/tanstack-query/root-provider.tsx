import type { DocboxClientExt } from "@/components/DocboxProvider";
import { DocboxClient } from "@docbox-nz/docbox-sdk";
import {
  hashKey,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: (key) => {
        // Replace "DocboxClient" reference with its unique key
        const parts = key.map((part) => {
          if (part instanceof DocboxClient) {
            const client = part;

            if (Object.hasOwn(client, "__unique_tenant_key")) {
              const tenantKey = (client as DocboxClientExt).__unique_tenant_key;
              return tenantKey;
            }

            return "missing-tenant-key";
          }

          return part;
        });

        return hashKey(parts);
      },
    },
  },
});

export function getContext() {
  return {
    queryClient,
  };
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
