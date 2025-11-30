import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { Language } from "@/i18n";
import { languages } from "@/i18n";

interface KPIsProps {
  language: Language;
}

export function KPIs({ language }: KPIsProps) {
  const t = languages[language];

  const kpiData = [
    { label: t.kpis.completion, value: "94%" },
    { label: t.kpis.expiration, value: "12" },
    { label: t.kpis.readiness, value: "87%" },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">{t.kpis.title}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {kpiData.map((kpi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl font-bold text-slate-900 dark:text-white mb-2"
                >
                  {kpi.value}
                </motion.div>
                <p className="text-slate-600 dark:text-slate-400">{kpi.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
