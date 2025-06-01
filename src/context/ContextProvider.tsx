// src/context/ContextProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '../database/database';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Alert, BackHandler } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';

export interface AppContextProps {
  db: SQLiteDatabase | null;
  generalLoading: boolean;
  setGeneralLoading: (loading: boolean) => void;
}

// Valor por defecto
export const AppContext = createContext<AppContextProps>({
  db: null,
  generalLoading: false,
  setGeneralLoading: () => { },
});

interface ContextProviderProps {
  children: ReactNode;
}

const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [generalLoading, setGeneralLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('Inicializando la base de datos...');
    initDatabase()
      .then(database => {
        setDb(database);
        setGeneralLoading(false);
        console.log('Base de datos inicializada correctamente');
      })
      .catch(error => {
        console.error('Error al inicializar la base de datos:', error);
        Alert.alert('Error', 'Error al abrir la base de datos: ' + error,
          [{
            text: 'Cerrar aplicación',
            onPress: () => {
              BackHandler.exitApp();
            },
          }]
        );
      });
  }, []);

  return (
    <AppContext.Provider value={{ db, generalLoading, setGeneralLoading }}>
      {
        generalLoading ? (
          <LoadingScreen fullWindow={true} />
        ) : (
          <>
            {children}
          </>
        )
      }
    </AppContext.Provider>
  );
};

export default ContextProvider;
