import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      className="text-sm font-medium"
    >
      {language === "en" ? "EN | عربي" : "English | عربي"}
    </Button>
  );
}
