import { en } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";

export const languages: Record<Language, typeof en> = {
  en,
  ar,
};

export const getTranslation = (lang: Language) => languages[lang];
