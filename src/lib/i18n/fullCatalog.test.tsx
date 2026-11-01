import "./fullCatalog";

import { useTranslation } from "hooks/useTranslation";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const TabEditorTitle = () => {
  const { t } = useTranslation("library");
  return <h1>{t("tab_editor.title")}</h1>;
};

describe("fullCatalog", () => {
  // zustand serves SSR and hydration from getInitialState(); a catalog that only
  // reached setState rendered raw keys on the server (tab-editor's <title>).
  it("is visible to the server render, not only to later client renders", () => {
    expect(renderToString(<TabEditorTitle />)).toContain("Tab Editor");
  });
});
