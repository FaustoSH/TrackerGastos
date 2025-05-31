// src/context/ContextProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '../database/database';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Alert } from 'react-native';

export interface AppContextProps {
  db: SQLiteDatabase | null;
  // Puedes agregar más propiedades o métodos que necesites en el futuro.
}

// Valor por defecto
export const AppContext = createContext<AppContextProps>({
  db: null
});

interface ContextProviderProps {
  children: ReactNode;
}

const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    initDatabase()
      .then(database => {
        setDb(database);
        console.log('Base de datos abierta en el contexto global');
      })
      .catch(error => {
        Alert.alert('Error al abrir la base de datos: '+ error);
      });
  }, []);

  return (
    <AppContext.Provider value={{ db}}>
      {children}
    </AppContext.Provider>
  );
};

export default ContextProvider;
