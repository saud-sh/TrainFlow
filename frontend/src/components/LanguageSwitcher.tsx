import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Language = "en" | "ar";

interface LanguageSwitcherProps {
  onChange?: (lang: Language) => void;
}

export function LanguageSwitcher({ onChange }: LanguageSwitcherProps) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved) {
      setLanguage(saved);
    }
  }, []);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    onChange?.(lang);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLanguage("en")}
        data-testid="button-language-en"
      >
        English
      </Button>
      <Button
        variant={language === "ar" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLanguage("ar")}
        data-testid="button-language-ar"
      >
        العربية
      </Button>
    </div>
  );
}
