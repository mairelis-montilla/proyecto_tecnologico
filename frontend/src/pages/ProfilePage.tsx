import { useAuthStore } from '../stores/auth.store'
import StudentProfile from './StudentProfile'
import ComingSoon from './ComingSoon'

function ProfilePage() {
  const user = useAuthStore(state => state.user)

  if (!user) return null

  switch (user.role) {
    case 'student':
      return <StudentProfile />

    case 'mentor':
      return (
        <ComingSoon
          title="Mi Perfil"
          description="El perfil de mentor estará disponible próximamente."
        />
      )

    default:
      return null
  }
}

export default ProfilePage
