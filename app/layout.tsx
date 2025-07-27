import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { NavSidebar } from "@/components/nav-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "YouTube Radar",
  description: "Monitor your YouTube channels activity and performance in real-time.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
              <NavSidebar />
              <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">{children}</div>
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
