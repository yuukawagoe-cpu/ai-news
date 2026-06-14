import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import { TranslationProvider } from "@/context/TranslationContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI News",
  description: "最新のAIニュースをまとめて閲覧",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <TranslationProvider>
          {children}
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  )
}
