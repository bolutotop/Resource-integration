'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthModalContextType {
  isLoginOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  return (
    <AuthModalContext.Provider value={{ isLoginOpen, openLoginModal, closeLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within a AuthModalProvider');
  }
  return context;
}