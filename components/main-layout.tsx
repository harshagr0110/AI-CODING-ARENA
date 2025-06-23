import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Breadcrumb } from "@/components/breadcrumb"

interface MainLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  showBreadcrumb?: boolean
}

export function MainLayout({ children, showFooter = true, showBreadcrumb = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {showBreadcrumb && (
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb />
          </div>
        )}
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
} 