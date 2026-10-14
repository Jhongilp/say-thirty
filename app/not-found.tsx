import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-black text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Esta página no existe</h1>
      <p className="mt-2 text-slate-600">Quizá la palabra que buscas aún no está en el reto.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700">
        Volver al reto
      </Link>
    </main>
  );
}
