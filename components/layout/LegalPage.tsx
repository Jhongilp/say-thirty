import type { ReactNode } from "react";

/** Shared shell for the legal/compliance pages. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <article className="prose-th">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Última actualización: {updated}</p>
        {children}
      </article>
    </main>
  );
}
