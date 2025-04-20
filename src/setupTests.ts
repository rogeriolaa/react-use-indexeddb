import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// Polyfill for structuredClone
if (typeof structuredClone === "undefined") {
  (global as any).structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}
