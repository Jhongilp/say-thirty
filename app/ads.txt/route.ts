import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Authorized Digital Sellers file required by AdSense, generated from NEXT_PUBLIC_ADSENSE_CLIENT. */
export function GET() {
  const publisherId = SITE.adsenseClient.replace(/^ca-/, "");
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Set NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-XXXXXXXXXXXXXXXX) to generate this file.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
