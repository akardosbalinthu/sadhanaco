import type { MetadataRoute } from "next";
import { resolvedSiteUrl } from "@/lib/site";

/** A fő weboldal robots.txt-je. A résztvevői felület (aldomain) saját, mindent tiltó robots.txt-t ad. */
export default function robots(): MetadataRoute.Robots {
  const base = resolvedSiteUrl().replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/tarsasag", "/fizetes", "/jelentkezes/", "/leiratkozas", "/egy-kedves-uzenet/megerosites"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
