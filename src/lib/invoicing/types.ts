/**
 * Cserélhető számlázási réteg (CLAUDE.md 7.1).
 * A kiállító entitás (most: KATA-s egyéni vállalkozó, AAM) és a szolgáltató
 * (most: Billingo) az adatbázisból jön (app_settings.billing_entity / invoice_provider),
 * így egy későbbi Kft.-re vagy más szolgáltatóra váltás nem igényel kódmódosítást
 * a hívó oldalon.
 */

export type RevenueRegion = "HU" | "EU" | "NON_EU";

export interface BillingEntity {
  name: string;
  /** Áfakulcs a számlán. KATA esetén mindig "AAM" (alanyi adómentes): nettó = bruttó. */
  tax_mode: "AAM" | string;
  kata: boolean;
  /** KATA: kizárólag magánszemélynek számlázhatunk. */
  b2c_only: boolean;
}

export interface InvoiceBuyer {
  name: string;
  email: string;
  /** ISO 3166-1 alpha-2, a Stripe számlázási címből. */
  country: string;
  postalCode?: string;
  city?: string;
  addressLine?: string;
}

export interface InvoiceLine {
  description: string;
  /** Bruttó egységár forintban (AAM: = nettó). */
  unitPriceHuf: number;
  quantity: number;
}

export interface IssueInvoiceInput {
  entity: BillingEntity;
  buyer: InvoiceBuyer;
  lines: InvoiceLine[];
  /** Idempotencia: ugyanarra a Stripe-eseményre ne készüljön két számla. */
  idempotencyKey: string;
  /** Pl. Stripe invoice / payment intent azonosító a megjegyzésbe. */
  reference?: string;
}

export interface IssuedInvoice {
  provider: string;
  providerInvoiceId: string;
  providerInvoiceNumber: string;
  pdfUrl?: string;
}

export interface CancelInvoiceInput {
  providerInvoiceId: string;
  reason: string;
}

export interface InvoiceProvider {
  readonly name: string;
  issueInvoice(input: IssueInvoiceInput): Promise<IssuedInvoice>;
  /** Csak admin sztornó, hibásan kiállított számla javítására (7.2). */
  cancelInvoice(input: CancelInvoiceInput): Promise<IssuedInvoice>;
}

export class InvoicingNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`A(z) ${provider} számlázó integráció még nincs bekötve.`);
    this.name = "InvoicingNotConfiguredError";
  }
}
