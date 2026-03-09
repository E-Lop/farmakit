import { get, set, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const IDB_KEY = "farmakit-react-query-cache";

export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(IDB_KEY, client);
    },
    restoreClient: async () => {
      return get<PersistedClient>(IDB_KEY);
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}

export async function clearPersistedCache(): Promise<void> {
  await del(IDB_KEY);
}
