import Header from './header'; 
import { getCurrentUser } from '@/lib/auth';

interface AuthHeaderProps {
  showSearch?: boolean;
}

export default async function AuthHeaderWrapper({ showSearch }: AuthHeaderProps) { 
    const user = await getCurrentUser();

    return <Header user={user} showSearch={showSearch}/>;
}