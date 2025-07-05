import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface MainLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
} 