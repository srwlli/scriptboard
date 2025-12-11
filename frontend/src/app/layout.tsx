import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MenuBar } from "@/components/MenuBar";
import { FooterBar } from "@/components/ui";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Scriptboard",
  description: "LLM prompt and response management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <div className="h-screen flex flex-col overflow-hidden">
              <MenuBar />
              <div className="flex-1 overflow-auto">
                {children}
              </div>
              <FooterBar />
            </div>
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

