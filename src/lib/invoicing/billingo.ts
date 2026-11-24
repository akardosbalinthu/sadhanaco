import "server-only";
import {
  InvoicingNotConfiguredError,
  type CancelInvoiceInput,
  type IssueInvoiceInput,
  type IssuedInvoice,
  type InvoiceProvider,
} from "./types";

/**
 * Billingo (API v3) — HELYŐRZŐ.
 * A tényleges bekötés a 2. fázisban: POST /documents (AAM áfakulcs, magánszemély vevő),
 * sztornó: POST /documents/{id}/cancel. Kulcs: BILLINGO_API_KEY (X-API-KEY fejléc).
 */
export class BillingoProvider implements InvoiceProvider {
  readonly name = "billingo";

  async issueInvoice(input: IssueInvoiceInput): Promise<IssuedInvoice> {
    void input;
    throw new InvoicingNotConfiguredError(this.name);
  }

  async cancelInvoice(input: CancelInvoiceInput): Promise<IssuedInvoice> {
    void input;
    throw new InvoicingNotConfiguredError(this.name);
  }
}
