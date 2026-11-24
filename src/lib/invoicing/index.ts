import "server-only";
import { BillingoProvider } from "./billingo";
import type { InvoiceProvider } from "./types";

export * from "./types";

/** A szolgáltató neve az app_settings.invoice_provider mezőből jön. */
export function getInvoiceProvider(name: string): InvoiceProvider {
  switch (name) {
    case "billingo":
      return new BillingoProvider();
    default:
      throw new Error(`Ismeretlen számlázó szolgáltató: ${name}`);
  }
}
