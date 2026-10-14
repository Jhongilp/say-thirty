import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: `Qué cookies y almacenamiento local utiliza ${SITE.name} y cómo gestionarlos.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" updated="14 de octubre de 2026">
      <p>
        Las cookies son pequeños archivos que los sitios web guardan en tu navegador. {SITE.name} usa el mínimo imprescindible y solo carga
        servicios de terceros después de que interactúas con la página.
      </p>

      <h2>Almacenamiento propio (técnico)</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Tipo</th>
            <th scope="col">Finalidad</th>
            <th scope="col">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>th_master_progress</code>
            </td>
            <td>localStorage</td>
            <td>Guardar tu progreso, mejores puntuaciones y racha diaria.</td>
            <td>Hasta que borres los datos del sitio</td>
          </tr>
        </tbody>
      </table>

      <h2>Cookies de terceros</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Proveedor</th>
            <th scope="col">Finalidad</th>
            <th scope="col">Más información</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Google AdSense / DoubleClick</td>
            <td>Mostrar y medir anuncios, prevenir fraude publicitario.</td>
            <td>
              <a href="https://policies.google.com/technologies/cookies?hl=es" rel="noopener noreferrer" target="_blank">
                Política de Google
              </a>
            </td>
          </tr>
          <tr>
            <td>Google Analytics 4</td>
            <td>Estadísticas agregadas de uso (IP anonimizada).</td>
            <td>
              <a href="https://support.google.com/analytics/answer/11397207?hl=es" rel="noopener noreferrer" target="_blank">
                Privacidad en GA4
              </a>
            </td>
          </tr>
          <tr>
            <td>Google reCAPTCHA v3 (Firebase App Check)</td>
            <td>Proteger el sitio frente a bots y tráfico no válido.</td>
            <td>
              <a href="https://policies.google.com/privacy?hl=es" rel="noopener noreferrer" target="_blank">
                Privacidad de Google
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Cómo gestionar las cookies</h2>
      <p>
        Puedes aceptar o rechazar las cookies publicitarias desde el aviso de consentimiento (en las regiones donde se muestre), desactivar la
        personalización en{" "}
        <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
          adssettings.google.com
        </a>{" "}
        o bloquear y eliminar cookies desde la configuración de tu navegador. Bloquear el almacenamiento local impedirá guardar tu progreso.
      </p>
      <p>
        Consulta también nuestra <Link href="/privacidad">Política de privacidad</Link>.
      </p>
    </LegalPage>
  );
}
