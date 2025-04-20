import { useCallback, useEffect, useRef, useState } from "react";

interface UseIndexedDBConfig {
  dbName: string;
  version: number;
  storeName: string;
}

interface UseIndexedDBResult<T> {
  add: (value: T) => Promise<void>;
  get: (id: string | number) => Promise<T | undefined>;
  getAll: () => Promise<T[]>;
  put: (value: T) => Promise<void>;
  remove: (id: string | number) => Promise<void>;
  clear: () => Promise<void>;
  error: Error | null;
  isReady: boolean;
  data: T[];
}

export function useIndexedDB<T extends { id: string | number }>({
  dbName,
  version,
  storeName,
}: UseIndexedDBConfig): UseIndexedDBResult<T> {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [data, setData] = useState<T[]>([]);

  // Use ref to avoid recreation of loadAllData function
  const dbRef = useRef<IDBDatabase | null>(null);
  dbRef.current = db;

  const loadAllData = useCallback(async () => {
    const currentDb = dbRef.current;
    if (!currentDb) return;

    const transaction = currentDb.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    return new Promise<void>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        setData(request.result);
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to get items"));
    });
  }, [storeName]); // Only depend on storeName which won't change

  useEffect(() => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      setError(new Error("Failed to open database"));
      setIsReady(false);
    };

    request.onsuccess = () => {
      const database = request.result;

      database.onversionchange = () => {
        database.close();
        setDb(null);
        setIsReady(false);
        setError(new Error("Database was updated in another window"));
      };

      setDb(database);
      setIsReady(true);
      loadAllData();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        setIsReady(false);
      }
    };
  }, [dbName, version, storeName, loadAllData]);

  const add = useCallback(
    async (value: T) => {
      if (!db) throw new Error("Database not initialized");
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      return new Promise<void>((resolve, reject) => {
        const request = store.add(value);
        transaction.oncomplete = () => {
          loadAllData().then(resolve);
        };
        request.onerror = () => reject(new Error("Failed to add item"));
      });
    },
    [db, storeName, loadAllData]
  );

  const get = useCallback(
    async (id: string | number) => {
      if (!db) throw new Error("Database not initialized");
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      return new Promise<T | undefined>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error("Failed to get item"));
      });
    },
    [db, storeName]
  );

  const getAll = useCallback(async () => {
    if (!db) throw new Error("Database not initialized");
    return data;
  }, [db, data]);

  const put = useCallback(
    async (value: T) => {
      if (!db) throw new Error("Database not initialized");
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      return new Promise<void>((resolve, reject) => {
        const request = store.put(value);
        transaction.oncomplete = () => {
          loadAllData().then(resolve);
        };
        request.onerror = () => reject(new Error("Failed to update item"));
      });
    },
    [db, storeName, loadAllData]
  );

  const remove = useCallback(
    async (id: string | number) => {
      if (!db) throw new Error("Database not initialized");
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        transaction.oncomplete = () => {
          loadAllData().then(resolve);
        };
        request.onerror = () => reject(new Error("Failed to delete item"));
      });
    },
    [db, storeName, loadAllData]
  );

  const clear = useCallback(async () => {
    if (!db) throw new Error("Database not initialized");
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      transaction.oncomplete = () => {
        loadAllData().then(resolve);
      };
      request.onerror = () => reject(new Error("Failed to clear store"));
    });
  }, [db, storeName, loadAllData]);

  return { add, get, getAll, put, remove, clear, error, isReady, data };
}
