import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: `Condiciones de uso del entrenador gratuito de pronunciación ${SITE.name}.`,
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso" updated="14 de octubre de 2026">
      <p>Al acceder y usar {SITE.name} aceptas estos términos. Si no estás de acuerdo, por favor no utilices el sitio.</p>

      <h2>1. Servicio</h2>
      <p>
        {SITE.name} es una herramienta educativa gratuita para practicar la pronunciación del inglés. Las puntuaciones son orientativas y se
        calculan automáticamente en tu dispositivo; no constituyen una certificación oficial de nivel de idioma.
      </p>

      <h2>2. Uso permitido</h2>
      <ul>
        <li>Debes usar el sitio de forma personal y lícita.</li>
        <li>
          Está prohibido el acceso automatizado (bots, scrapers), generar tráfico o clics artificiales en anuncios y cualquier intento de
          interferir con la seguridad del servicio.
        </li>
        <li>No puedes copiar ni redistribuir masivamente los contenidos sin autorización.</li>
      </ul>

      <h2>3. Propiedad intelectual</h2>
      <p>
        Los textos, ilustraciones, guías anatómicas y el software de {SITE.name} están protegidos por derechos de propiedad intelectual. Las
        marcas de terceros mencionadas pertenecen a sus respectivos titulares.
      </p>

      <h2>4. Publicidad</h2>
      <p>
        El sitio se financia con anuncios de Google AdSense. No somos responsables del contenido de los anuncios ni de los sitios de terceros
        a los que enlazan.
      </p>

      <h2>5. Limitación de responsabilidad</h2>
      <p>
        El servicio se ofrece «tal cual», sin garantías de disponibilidad continua ni de exactitud absoluta de la evaluación. En la medida
        permitida por la ley, no respondemos por daños derivados del uso del sitio.
      </p>

      <h2>6. Cambios</h2>
      <p>Podemos actualizar estos términos. La fecha de la última actualización figura al inicio de esta página.</p>

      <h2>7. Contacto</h2>
      <p>
        Para cualquier consulta visita la página de <Link href="/contacto">contacto</Link> o consulta la{" "}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>
    </LegalPage>
  );
}
