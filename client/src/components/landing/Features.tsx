import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Network,
  Zap,
  Brain,
  BarChart3,
  Shield,
  Package,
  Workflow,
  Database,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

const icons = [
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Network,
  Zap,
  Brain,
  BarChart3,
  Shield,
  Package,
  Workflow,
  Database,
  AlertTriangle,
];

export function Features() {
  const { language } = useLanguage();
  const t = languages[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t.features.title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            {t.features.subtitle}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
        >
          {t.features.modules.map((module, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {module.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
