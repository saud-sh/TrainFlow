import { Mail } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n";

export function Footer() {
  const { language } = useLanguage();
  const t = languages[language];

  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-2">{t.footer.company}</h3>
            <p className="text-slate-400">{t.footer.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition">
                  {t.footer.privacy}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  {t.footer.terms}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Security
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t.footer.contact}</h4>
            <a
              href={`mailto:${t.footer.email}`}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              data-testid="link-email-contact"
            >
              <Mail className="w-4 h-4" />
              {t.footer.email}
            </a>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
          <p>
            © {new Date().getFullYear()} {t.footer.company}. {t.footer.rights}.
          </p>
        </div>
      </div>
    </footer>
  );
}
