// src/context/ContextProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '../database/database';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

export interface AppContextProps {
  db: SQLiteDatabase | null;
  loading: boolean
  setLoading: (arg0: boolean) => void
  // Puedes agregar más propiedades o métodos que necesites en el futuro.
}

// Valor por defecto
export const AppContext = createContext<AppContextProps>({
  db: null,
  loading: true,
  setLoading: ()=>{}
});

interface ContextProviderProps {
  children: ReactNode;
}

const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState<boolean>(true)


  useEffect(() => {
    initDatabase()
      .then(database => {
        setDb(database);
        console.log('Base de datos abierta en el contexto global');
      })
      .catch(error => {
        console.error('Error al abrir la base de datos:', error);
      });
  }, []);

  return (
    <AppContext.Provider value={{ db, loading, setLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export default ContextProvider;
