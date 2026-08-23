/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Wątki startują szybciej niż forki (szczególnie na Windowsie).
    pool: "threads",
    // jsdom kosztuje ~1.5s startu na plik, a większość testów to czysta logika.
    // Pliki, które faktycznie potrzebują DOM-u, deklarują `// @vitest-environment jsdom`
    // w pierwszej linii.
    environment: "node",
  },
});
