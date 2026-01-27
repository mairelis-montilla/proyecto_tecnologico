import { useAuthStore } from '../stores/auth.store'
import StudentProfile from './StudentProfile'
import MentorProfile from './MentorProfile'

function ProfilePage() {
  const user = useAuthStore(state => state.user)

  if (!user) return null

  switch (user.role) {
    case 'student':
      return <StudentProfile />

    case 'mentor':
      return <MentorProfile />

    default:
      return null
  }
}

export default ProfilePage
