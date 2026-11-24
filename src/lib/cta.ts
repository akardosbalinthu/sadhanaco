import { SITE } from "@/lib/site";

/** Amíg az online csatlakozás nem nyílt meg: előre kitöltött értesítéskérő e-mail. */
export function notifyHref(topic: string): string {
  const subject = encodeURIComponent(`Értesítést kérek: ${topic}`);
  const body = encodeURIComponent("Szia Bálint!\n\nKérlek, írj nekem, amikor elindul.\n\nKöszönöm!");
  return `mailto:${SITE.email}?subject=${subject}&body=${body}`;
}
