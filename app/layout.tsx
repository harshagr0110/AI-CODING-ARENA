import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata : Metadata = {
  title: "AI Coding Arena - Multiplayer Coding Competitions",
  description: "Compete in real-time coding challenges powered by AI. Join multiplayer coding battles with instant feedback and smart scoring.",
  keywords: "coding, competition, multiplayer, AI, programming, challenges, real-time",
  authors: [{ name: "AI Coding Arena Team" }],
  creator: "AI Coding Arena",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aicodingarena.com",
    title: "AI Coding Arena - Multiplayer Coding Competitions",
    description: "Compete in real-time coding challenges powered by AI",
    siteName: "AI Coding Arena",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Coding Arena - Multiplayer Coding Competitions",
    description: "Compete in real-time coding challenges powered by AI",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
