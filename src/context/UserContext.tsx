// src/context/UserContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from './types';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  avatar?: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: (session.user as any).id || '',
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: (session.user as any).role || 'receptionist',
        avatar: session.user.image,
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};