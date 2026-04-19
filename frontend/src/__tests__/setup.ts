import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Suppress noisy console.error in tests
const originalConsoleError = console.error;
beforeEach(() => {
  localStorageMock.clear();
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});
