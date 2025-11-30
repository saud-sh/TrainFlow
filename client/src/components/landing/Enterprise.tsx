import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Database,
  Shield,
  LogSquare,
  Zap,
  Brain,
  Bell,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

const icons = [Database, Shield, LogSquare, Zap, Brain, Bell];

export function Enterprise() {
  const { language } = useLanguage();
  const t = languages[language];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">{t.enterprise.title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t.enterprise.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.enterprise.features.map((feature, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
