import { act, renderHook } from "@testing-library/react";
import { useIndexedDB } from "../useIndexedDB";

interface TestItem {
  id: string;
  name: string;
}

describe("useIndexedDB", () => {
  const TEST_DB = {
    dbName: "TestDB",
    version: 1,
    storeName: "testStore",
  };

  const testItem: TestItem = {
    id: "1",
    name: "Test Item",
  };

  beforeEach(async () => {
    // Clear all databases before each test
    const databases = await window.indexedDB.databases();
    await Promise.all(
      databases.map((db) => db.name && window.indexedDB.deleteDatabase(db.name))
    );
  });

  // Basic CRUD operation tests
  it("should initialize the database successfully", async () => {
    const { result } = renderHook(() => useIndexedDB<TestItem>(TEST_DB));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should perform basic CRUD operations", async () => {
    const { result } = renderHook(() => useIndexedDB<TestItem>(TEST_DB));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Test operations with undefined values
    await act(async () => {
      await expect(
        result.current.add({ ...testItem, id: undefined as any })
      ).rejects.toThrow();
      await expect(result.current.get(undefined as any)).rejects.toThrow();
      await expect(
        result.current.put({ ...testItem, id: undefined as any })
      ).rejects.toThrow();
      await expect(result.current.remove(undefined as any)).rejects.toThrow();
    });

    // Test add
    await act(async () => {
      await result.current.add(testItem);
    });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual(testItem);

    // Test get
    let item: TestItem | undefined;
    await act(async () => {
      item = await result.current.get(testItem.id);
    });
    expect(item).toEqual(testItem);

    // Test update
    const updatedItem = { ...testItem, name: "Updated Item" };
    await act(async () => {
      await result.current.put(updatedItem);
    });
    expect(result.current.data[0]).toEqual(updatedItem);

    // Test getAll
    let allItems: TestItem[] = [];
    await act(async () => {
      allItems = await result.current.getAll();
    });
    expect(allItems).toHaveLength(1);
    expect(allItems[0]).toEqual(updatedItem);

    // Test remove
    await act(async () => {
      await result.current.remove(testItem.id);
    });
    expect(result.current.data).toHaveLength(0);

    // Test clear
    await act(async () => {
      await result.current.add(testItem);
      await result.current.add({ ...testItem, id: "2" });
      await result.current.clear();
    });
    expect(result.current.data).toHaveLength(0);
  });

  it("should handle database initialization errors", async () => {
    // Create a database with a higher version first
    const higherVersionRequest = indexedDB.open(
      TEST_DB.dbName,
      TEST_DB.version + 1
    );

    await act(async () => {
      await new Promise<void>((resolve) => {
        higherVersionRequest.onupgradeneeded = () => {
          const db = higherVersionRequest.result;
          db.createObjectStore(TEST_DB.storeName, { keyPath: "id" });
        };
        higherVersionRequest.onsuccess = () => {
          resolve();
        };
      });
    });

    // Try to open with a lower version to force an error
    const { result } = renderHook(() => useIndexedDB<TestItem>(TEST_DB));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isReady).toBe(false);

    // Clean up
    higherVersionRequest.result?.close();

    // Test operations when not initialized
    await act(async () => {
      await expect(result.current.add(testItem)).rejects.toThrow(
        "Database not initialized"
      );
      await expect(result.current.get("1")).rejects.toThrow(
        "Database not initialized"
      );
      await expect(result.current.getAll()).rejects.toThrow(
        "Database not initialized"
      );
      await expect(result.current.put(testItem)).rejects.toThrow(
        "Database not initialized"
      );
      await expect(result.current.remove("1")).rejects.toThrow(
        "Database not initialized"
      );
      await expect(result.current.clear()).rejects.toThrow(
        "Database not initialized"
      );
    });
  });

  it("should handle version changes", async () => {
    const { result } = renderHook(() => useIndexedDB<TestItem>(TEST_DB));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Try to open with a higher version
    const request = indexedDB.open(TEST_DB.dbName, TEST_DB.version + 1);

    await act(async () => {
      await new Promise<void>((resolve) => {
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(TEST_DB.storeName)) {
            db.createObjectStore(TEST_DB.storeName, { keyPath: "id" });
          }
          resolve();
        };
      });
    });

    // Wait for state update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.error?.message).toBe(
      "Database was updated in another window"
    );

    // Clean up
    request.result?.close();
  });

  it("should handle operation errors", async () => {
    const { result } = renderHook(() => useIndexedDB<TestItem>(TEST_DB));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Mock error by trying to add invalid items
    await act(async () => {
      // Add without id should throw
      await expect(
        result.current.add({ name: "Invalid" } as any)
      ).rejects.toThrow();

      // Get non-existent item should return undefined
      const item = await result.current.get("nonexistent");
      expect(item).toBeUndefined();

      // Put should create a new item if it doesn't exist
      const newItem = { id: "nonexistent", name: "test" };
      await result.current.put(newItem);
    });

    // Wait for state update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify the item was added
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual({ id: "nonexistent", name: "test" });

    // Remove non-existent item should not throw
    await act(async () => {
      await result.current.remove("another-nonexistent");
    });

    // Data should still contain our previously added item
    expect(result.current.data).toHaveLength(1);
  });

  it("should handle cleanup on unmount", async () => {
    // Create initial instance
    const { result, unmount } = renderHook(() =>
      useIndexedDB<TestItem>(TEST_DB)
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Add some data
    await act(async () => {
      await result.current.add(testItem);
    });

    expect(result.current.data).toHaveLength(1);

    // Unmount to trigger cleanup
    unmount();

    // Create new instance to verify cleanup
    const { result: result2 } = renderHook(() =>
      useIndexedDB<TestItem>(TEST_DB)
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result2.current.isReady).toBe(true);
    expect(result2.current.error).toBeNull();
    expect(result2.current.data).toHaveLength(0); // Data should be cleared after unmount
  });
});
