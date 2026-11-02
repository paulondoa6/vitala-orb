export type AssistantLanguage = "fr" | "en" | "es";

export const normalizeLanguage = (value: unknown): AssistantLanguage => {
  if (typeof value !== "string") return "fr";
  const code = value.toLowerCase().split(/[-_]/)[0];
  return code === "en" || code === "es" ? code : "fr";
};

export const languageInstruction = (value: unknown): string => {
  const names = { fr: "French", en: "English", es: "Spanish" };
  return `The user's selected app language is ${names[normalizeLanguage(value)]}. Always reply in that language, including link labels, even when the question or earlier messages use another language. Keep names and user-authored content unchanged.`;
};