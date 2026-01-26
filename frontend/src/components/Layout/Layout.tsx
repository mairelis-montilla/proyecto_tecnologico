import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col h-full lg:ml-0">
          {/* Header */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t py-4 px-6 flex-shrink-0">
            <div className="text-center text-sm text-gray-500">
              © 2026 MentorMatch. Todos los derechos reservados.
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
