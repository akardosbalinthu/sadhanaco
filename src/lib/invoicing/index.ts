import "server-only";
import { BillingoProvider } from "./billingo";
import type { InvoiceProvider } from "./types";

export * from "./types";

/**
 * A szolgáltató neve az app_settings.invoice_provider mezőből jön.
 * "manual": nincs automatikus kiállítás – a tételt az invoices táblában rögzítjük,
 * a számlát Bálint kézzel állítja ki, a sorszámot az admin utólag beírja.
 */
export function getInvoiceProvider(name: string): InvoiceProvider | null {
  switch (name) {
    case "manual":
      return null;
    case "billingo":
      return new BillingoProvider();
    default:
      throw new Error(`Ismeretlen számlázó szolgáltató: ${name}`);
  }
}
