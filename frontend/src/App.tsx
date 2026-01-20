import Landing from '@/pages/Landing'

function App() {
  const handleLogin = () => {
    // TODO: Navegar a la página de login
    console.log('Navegar a Login')
  }

  const handleRegister = () => {
    // TODO: Navegar a la página de registro
    console.log('Navegar a Registro')
  }

  return <Landing onLogin={handleLogin} onRegister={handleRegister} />
}

export default App
