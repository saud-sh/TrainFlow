import { useState, useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Enterprise } from "@/components/landing/Enterprise";
import { KPIs } from "@/components/landing/KPIs";
import { Workflow } from "@/components/landing/Workflow";
import { Integrations } from "@/components/landing/Integrations";
import { AI } from "@/components/landing/AI";
import { Security } from "@/components/landing/Security";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Language } from "@/i18n";

export default function Landing() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved) {
      setLanguage(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className="min-h-screen">
      {/* Navigation bar with language switcher */}
      <nav className="fixed top-0 right-0 left-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            TrainFlow
          </div>
          <LanguageSwitcher onChange={handleLanguageChange} />
        </div>
      </nav>

      {/* Main content with top padding for nav */}
      <main className="pt-20">
        <Hero language={language} />
        <Features language={language} />
        <Enterprise language={language} />
        <KPIs language={language} />
        <Workflow language={language} />
        <Integrations language={language} />
        <AI language={language} />
        <Security language={language} />
        <FAQ language={language} />
      </main>

      <Footer language={language} />
    </div>
  );
}
