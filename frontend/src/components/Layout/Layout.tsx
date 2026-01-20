import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          {/* Header */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t py-4 px-6">
            <div className="text-center text-sm text-gray-500">
              © 2026 MentorMatch. Todos los derechos reservados.
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
