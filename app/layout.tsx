import Link from "next/link";
import type { ReactNode } from "react";
import { ScenarioTitle } from "./_components/ScenarioTitle.tsx";
import "./globals.css";

export const metadata = { title: "Mini Studio" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/" className="brand">Mini Studio</Link>
          <nav>
            <Link href="/">Runs</Link>
            <Link href="/lab">Lab</Link>
            <Link href="/agents">Agents</Link>
          </nav>
          <ScenarioTitle />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
