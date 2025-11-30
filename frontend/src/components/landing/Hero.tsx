import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Language } from "@/i18n";
import { languages } from "@/i18n";

interface HeroProps {
  language: Language;
}

export function Hero({ language }: HeroProps) {
  const t = languages[language];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(at 20% 50%, #3b82f6 0%, transparent 50%)",
            "radial-gradient(at 80% 50%, #1e40af 0%, transparent 50%)",
            "radial-gradient(at 20% 50%, #3b82f6 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-slate-300 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-hero-login"
            >
              {t.hero.cta_login}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              data-testid="button-hero-demo"
            >
              {t.hero.cta_demo}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating shapes animation */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>
    </section>
  );
}
