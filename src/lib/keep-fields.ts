import { startTransition, type FormEvent } from "react";

/**
 * A React 19 egy űrlapművelet (form action) után kiüríti a mezőket – hibaüzenetnél így a
 * kitöltő elveszítené, amit begépelt. Ezzel a beküldéssel a műveletet kézzel indítjuk,
 * így a mezők megmaradnak; a böngésző beépített ellenőrzése (required, min…) változatlanul fut.
 */
export function keepFields(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}
