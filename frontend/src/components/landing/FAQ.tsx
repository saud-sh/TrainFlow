import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Language } from "@/i18n";
import { languages } from "@/i18n";

interface FAQProps {
  language: Language;
}

export function FAQ({ language }: FAQProps) {
  const t = languages[language];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">{t.faq.title}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {t.faq.items.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-slate-200 dark:border-slate-700"
              >
                <AccordionTrigger className="text-left hover:no-underline hover:text-blue-600 dark:hover:text-blue-400">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
