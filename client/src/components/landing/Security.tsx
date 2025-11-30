import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Shield, Lock, CheckCircle2, Eye, BarChart3, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

const icons = [Shield, Lock, CheckCircle2, Eye, BarChart3, Zap];

export function Security() {
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
          <h2 className="text-4xl font-bold mb-4">{t.security.title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t.security.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.security.features.map((feature, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
                  <Icon className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700 dark:text-slate-300">{feature}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
