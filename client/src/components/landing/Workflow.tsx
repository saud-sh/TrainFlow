import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

export function Workflow() {
  const { language } = useLanguage();
  const t = languages[language];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">{t.workflow.title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t.workflow.subtitle}
          </p>
        </motion.div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {t.workflow.steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <Card className="p-6 text-center mb-4 w-full">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </Card>
                {idx < t.workflow.steps.length - 1 && (
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="hidden md:block mb-4"
                  >
                    <ArrowRight className="w-6 h-6 text-blue-600 rotate-90" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
