import { useNavigate } from 'react-router-dom';
import ProfileContent from '../../features/profile/ProfileContent';
import ManagerLayout from './ManagerLayout';

export default function ManagerSettings() {
  const navigate = useNavigate();

  return (
    <ManagerLayout>
      <ProfileContent onCancel={() => void navigate('/manager')} />
    </ManagerLayout>
  );
}
