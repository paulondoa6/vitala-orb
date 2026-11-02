import { afterEach, describe, expect, it } from "vitest";
import i18n, { setLanguage } from "./i18n";
import { normalizeLanguage, languageInstruction } from "../../supabase/functions/assistant-chat/language";

afterEach(async () => { await setLanguage("fr"); });

describe("selected application language", () => {
  it.each(["fr", "en", "es"] as const)("persists %s and updates the document language", async (language) => {
    await setLanguage(language);
    expect(i18n.resolvedLanguage).toBe(language);
    expect(localStorage.getItem("vitalio:lang")).toBe(language);
    expect(document.documentElement.lang).toBe(language);
  });

  it("normalizes device languages and defaults unsupported languages to French", () => {
    expect(normalizeLanguage("en-US")).toBe("en");
    expect(normalizeLanguage("es-MX")).toBe("es");
    expect(normalizeLanguage("fr-CA")).toBe("fr");
    expect(normalizeLanguage("de-DE")).toBe("fr");
  });

  it.each([["fr", "French"], ["en", "English"], ["es", "Spanish"]])("enforces %s for assistant replies", (code, name) => {
    expect(languageInstruction(code)).toContain(`selected app language is ${name}`);
    expect(languageInstruction(code)).toContain("even when the question or earlier messages use another language");
  });
});