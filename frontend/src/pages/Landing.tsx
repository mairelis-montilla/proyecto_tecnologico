interface LandingProps {
  onLogin: () => void
  onRegister: () => void
}

function Landing({ onLogin, onRegister }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-celeste-light via-white to-cielo-light">
      {/* Header/Navbar */}
      <header className="w-full px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purpura to-indigo rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-indigo">MentorMatch</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2 text-indigo font-medium hover:text-purpura transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onRegister}
              className="px-6 py-2 bg-purpura hover:bg-purpura-dark text-white font-medium rounded-lg transition-colors"
            >
              Registrarse
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-indigo-dark leading-tight">
              Conecta con el
              <span className="text-purpura"> mentor perfecto</span> para tu carrera
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Encuentra profesionales experimentados que te guiarán en tu desarrollo profesional.
              Agenda sesiones personalizadas y alcanza tus metas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onRegister}
                className="px-8 py-4 bg-gradient-to-r from-purpura to-indigo hover:from-purpura-dark hover:to-indigo-dark text-white font-semibold rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Comenzar ahora
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 border-2 border-indigo text-indigo hover:bg-indigo hover:text-white font-semibold rounded-xl text-lg transition-all"
              >
                Ya tengo cuenta
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-purpura">500+</p>
                <p className="text-gray-600">Mentores activos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-azul">10k+</p>
                <p className="text-gray-600">Sesiones realizadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-rosa">4.9</p>
                <p className="text-gray-600">Calificación promedio</p>
              </div>
            </div>
          </div>

          {/* Illustration/Cards */}
          <div className="relative hidden lg:block">
            <div className="absolute top-0 right-0 w-72 h-72 bg-purpura-light/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cielo/30 rounded-full blur-3xl"></div>

            {/* Mentor Cards Stack */}
            <div className="relative z-10 space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl ml-12 transform rotate-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-rosa to-purpura rounded-full"></div>
                  <div>
                    <p className="font-semibold text-indigo-dark">Ana García</p>
                    <p className="text-gray-500 text-sm">Senior Developer</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">React</span>
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">TypeScript</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl transform -rotate-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-azul to-indigo rounded-full"></div>
                  <div>
                    <p className="font-semibold text-indigo-dark">Carlos López</p>
                    <p className="text-gray-500 text-sm">Product Manager</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">Agile</span>
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">Strategy</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl ml-8 transform rotate-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cielo to-azul rounded-full"></div>
                  <div>
                    <p className="font-semibold text-indigo-dark">María Torres</p>
                    <p className="text-gray-500 text-sm">UX Designer</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">Figma</span>
                  <span className="px-3 py-1 bg-celeste text-indigo-dark text-sm rounded-full">Research</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-rosa to-rosa-dark rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-dark mb-3">Encuentra tu mentor</h3>
            <p className="text-gray-600">Busca entre cientos de profesionales por especialidad, experiencia y disponibilidad.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-purpura to-indigo rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-dark mb-3">Agenda fácilmente</h3>
            <p className="text-gray-600">Reserva sesiones según tu disponibilidad con nuestro sistema de calendario integrado.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-azul to-cielo rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-indigo-dark mb-3">Crece profesionalmente</h3>
            <p className="text-gray-600">Recibe orientación personalizada y acelera tu desarrollo de carrera.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-indigo-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-indigo font-bold">M</span>
              </div>
              <span className="text-xl font-bold">MentorMatch</span>
            </div>
            <p className="text-celeste">© 2026 MentorMatch. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
