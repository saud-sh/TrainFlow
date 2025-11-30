// ACTIVE FRONTEND ENTRY: client/src/
// This is the version used for production build & training.rocktech.sa
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Workflow } from "@/components/landing/Workflow";
import { AI } from "@/components/landing/AI";
import { Security } from "@/components/landing/Security";
import { KPIs } from "@/components/landing/KPIs";
import { Integrations } from "@/components/landing/Integrations";
import { Enterprise } from "@/components/landing/Enterprise";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import LanguageSwitcher with fallback
const LanguageSwitcher = dynamic(
  () => import("@/components/landing/LanguageSwitcher").then(mod => ({ default: mod.LanguageSwitcher })),
  { ssr: false, loading: () => null }
);

export default function Landing() {
  return (
    <div className="min-h-screen w-full">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-slate-900 dark:text-white">
            TrainFlow
          </div>
          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Main Content - Add padding-top to account for fixed navbar */}
      <div className="pt-16">
        <Hero />
        <Features />
        <Enterprise />
        <Workflow />
        <AI />
        <KPIs />
        <Security />
        <Integrations />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}
