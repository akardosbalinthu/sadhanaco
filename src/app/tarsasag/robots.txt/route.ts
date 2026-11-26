/** A résztvevői felület (tarsasag.akardosbalint.hu/robots.txt) – keresők elől teljesen zárt. */
export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
