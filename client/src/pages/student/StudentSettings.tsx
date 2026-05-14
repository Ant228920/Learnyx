import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import ProfileContent from '../../features/profile/ProfileContent';

export default function StudentSettings() {
  const navigate = useNavigate();
  return (
    <StudentLayout>
      <ProfileContent onCancel={() => void navigate('/dashboard')} />
    </StudentLayout>
  );
}
