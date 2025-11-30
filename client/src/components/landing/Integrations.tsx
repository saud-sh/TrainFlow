import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

export function Integrations() {
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
          <h2 className="text-4xl font-bold mb-4">{t.integrations.title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t.integrations.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {t.integrations.systems.map((system, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                    {system.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {system}
                </h3>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
