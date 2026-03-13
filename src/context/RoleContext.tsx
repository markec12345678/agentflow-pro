// src/context/RoleContext.tsx
import { createContext, useContext, useState } from 'react';
import { Role } from './types';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>('receptionist');

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};