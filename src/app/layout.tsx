import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
