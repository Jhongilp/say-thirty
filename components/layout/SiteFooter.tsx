import Link from "next/link";
import { SITE } from "@/lib/site";

const LEGAL_LINKS = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contacto", label: "Contacto" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.name}. Pronunciación de inglés gratis para hispanohablantes.
        </p>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-4">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-indigo-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
