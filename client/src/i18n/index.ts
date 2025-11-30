// ACTIVE FRONTEND ENTRY: client/src/
// This is the version used for production build & training.rocktech.sa
import { en } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";

export const languages: Record<Language, typeof en> = {
  en,
  ar,
};
