import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/fake-auth';

const Index = () => {
  const { isAuthed } = useAuth();
  return <Navigate to={isAuthed ? '/app/dashboard' : '/login'} replace />;
};

export default Index;
