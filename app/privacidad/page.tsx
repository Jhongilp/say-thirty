import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Cómo ${SITE.name} trata tus datos: micrófono procesado en tu navegador, progreso local, cookies publicitarias y analítica.`,
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="14 de octubre de 2026">
      <p>
        En {SITE.name} ({SITE.url}) respetamos tu privacidad. Esta política explica qué datos se tratan cuando usas el entrenador de
        pronunciación y con qué finalidad.
      </p>

      <h2>1. Responsable</h2>
      <p>
        El responsable del sitio es el equipo de {SITE.name}. Puedes contactarnos en{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>

      <h2>2. Micrófono y voz</h2>
      <ul>
        <li>
          El análisis acústico (forma de onda y energía de frecuencias) se realiza <strong>íntegramente en tu navegador</strong> mediante la
          Web Audio API. No grabamos, almacenamos ni enviamos tu audio a nuestros servidores.
        </li>
        <li>
          Si tu navegador ofrece reconocimiento de voz (Web Speech API), el propio navegador puede enviar el audio a su proveedor (por
          ejemplo, Google en Chrome o Apple en Safari) para transcribirlo, conforme a la política de privacidad de dicho proveedor.{" "}
          {SITE.name} solo recibe el texto transcrito en tu dispositivo para compararlo con la palabra objetivo.
        </li>
        <li>Puedes revocar el permiso del micrófono en cualquier momento desde la configuración de tu navegador.</li>
      </ul>

      <h2>3. Progreso de aprendizaje</h2>
      <p>
        Tus palabras superadas, mejores puntuaciones y racha diaria se guardan en el <code>localStorage</code> de tu navegador bajo la clave{" "}
        <code>th_master_progress</code>. Estos datos no salen de tu dispositivo y puedes borrarlos limpiando los datos del sitio.
      </p>

      <h2>4. Publicidad (Google AdSense)</h2>
      <p>
        Este sitio es gratuito gracias a la publicidad de Google AdSense. Google y sus socios pueden usar cookies e identificadores para
        mostrar anuncios basados en tus visitas a este y otros sitios. Puedes desactivar la publicidad personalizada en{" "}
        <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
          la configuración de anuncios de Google
        </a>{" "}
        y consultar{" "}
        <a href="https://policies.google.com/technologies/ads?hl=es" rel="noopener noreferrer" target="_blank">
          cómo usa Google los datos en la publicidad
        </a>
        . En el Espacio Económico Europeo, Reino Unido y Suiza se solicitará tu consentimiento mediante una plataforma de gestión de
        consentimiento certificada por Google antes de usar cookies publicitarias.
      </p>

      <h2>5. Analítica y seguridad</h2>
      <p>
        Podemos usar Google Analytics 4 con IP anonimizada para medir el uso agregado del sitio, y Firebase App Check con reCAPTCHA v3 para
        proteger el servicio frente a tráfico automatizado. Estos servicios solo se cargan después de que interactúes con la página.
      </p>

      <h2>6. Base legal y derechos</h2>
      <p>
        Tratamos los datos con base en tu consentimiento (cookies publicitarias y analítica) y en nuestro interés legítimo en mantener el
        sitio seguro. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiéndonos
        al correo de contacto. También puedes reclamar ante la autoridad de protección de datos de tu país.
      </p>

      <h2>7. Menores</h2>
      <p>El servicio no está dirigido a menores de 13 años y no recopilamos conscientemente datos de menores.</p>

      <p>
        Más información en nuestra <Link href="/cookies">Política de cookies</Link> y en los <Link href="/terminos">Términos de uso</Link>.
      </p>
    </LegalPage>
  );
}
