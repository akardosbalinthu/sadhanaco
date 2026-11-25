import { redirect } from "next/navigation";
import { tp } from "@/lib/site";

// A Társaság megszűnt (2026. november 25., docs/KONCEPCIO.md): ez az oldal a programba irányít.
export default function Retired() {
  redirect(tp("/program"));
}
