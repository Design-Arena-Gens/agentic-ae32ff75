export const metadata = {
  title: "Calling AI Agent",
  description: "Voice calling AI agent powered by WebLLM",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
