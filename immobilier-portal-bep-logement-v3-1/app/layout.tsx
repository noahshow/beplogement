import "./globals.css";
import { ReactNode } from "react";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "BEP Logement — Portail abonnés",
  description: "Accès abonnés aux logements + demandes de coordonnées propriétaires validées par l’agence.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* @ts-expect-error Server Component */}
        <Nav />
        {children}
      </body>
    </html>
  );
}
