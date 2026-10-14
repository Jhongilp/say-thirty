import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Contacta con el equipo de ${SITE.name}: sugerencias de palabras, errores o colaboraciones.`,
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <LegalPage title="Contacto" updated="14 de octubre de 2026">
      <p>¿Tienes una sugerencia, encontraste un error o quieres proponer una palabra para el próximo reto? Nos encantará leerte.</p>
      <p className="not-prose my-6">
        <a
          href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Contacto ${SITE.name}`)}`}
          className="inline-block rounded-full bg-indigo-600 px-6 py-3 font-bold text-white no-underline shadow hover:bg-indigo-700"
        >
          Escribir a {SITE.contactEmail}
        </a>
      </p>
      <h2>Antes de escribir</h2>
      <ul>
        <li>
          <strong>El micrófono no funciona:</strong> comprueba que diste permiso al navegador y que ninguna otra app lo está usando. En iPhone,
          abre el sitio en Safari en lugar del navegador interno de Instagram o TikTok.
        </li>
        <li>
          <strong>La puntuación parece injusta:</strong> habla cerca del micrófono en un lugar sin ruido y alarga ligeramente el soplo de la TH.
        </li>
        <li>
          <strong>Privacidad:</strong> para ejercer tus derechos sobre datos personales, indica «Privacidad» en el asunto.
        </li>
      </ul>
      <p>Respondemos normalmente en un plazo de 2 a 5 días laborables.</p>
    </LegalPage>
  );
}
