import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/web/components/Nav";

export const metadata: Metadata = {
  title: "AgentFlow Pro",
  description: "Multi-Agent AI Platform za business avtomatizacijo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
