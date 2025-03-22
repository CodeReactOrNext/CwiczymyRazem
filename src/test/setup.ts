import "@testing-library/jest-dom/vitest";
import '@testing-library/jest-dom';

import { vi } from "vitest";

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Dodatkowe globalne konfiguracje testowe można dodać tutaj 