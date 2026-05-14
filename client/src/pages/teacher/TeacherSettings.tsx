import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import ProfileContent from '../../features/profile/ProfileContent';

export default function TeacherSettings() {
  const navigate = useNavigate();
  return (
    <TeacherLayout>
      <ProfileContent onCancel={() => void navigate('/teacher')} />
    </TeacherLayout>
  );
}
