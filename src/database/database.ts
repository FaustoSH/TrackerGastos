import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { databaseOperations } from './databaseOperations';

// Habilitar debug (opcional, para ver logs en la consola)
// SQLite.DEBUG(true);
// SQLite.enablePromise(true);

const database_name = "TrackerGastos.db";
const CURRENT_DB_VERSION = 2; //El número de la versión actual debe coincidir con el número mayor de la versión de la base de datos en el archivo databaseOperations.ts


export const openDatabase = async (): Promise<SQLiteDatabase> => {
  return SQLite.openDatabase(
    {
      name: database_name,
      location: 'default',
    },
    () => {
      console.log('Base de datos abierta');
    },
    (error: any) => {
      throw error;
    }
  );
};

export const initDatabase = async (): Promise<SQLiteDatabase> => {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(databaseOperations.createHuchasTable);

        tx.executeSql(databaseOperations.createMovimientosTable);

        tx.executeSql(databaseOperations.createDbVersionTable);

        tx.executeSql(databaseOperations.createTriggerCheckBalanceBeforeInsert);

        tx.executeSql(databaseOperations.createTriggerUpdateHuchaBalanceAfterInsert);

        tx.executeSql(databaseOperations.createTriggerHandleHuchaDeletion);

      },
        error => {
          reject(error);
        },
        () => {
          resolve();
        });
    });
    // Actualizar triggers después de inicializar la base de datos
    await checkAndUpdateVersion(db);

    return db;
  } catch (error) {
    throw error;
  }
};

export const asyncExecuteSQL = async (
  db: SQLiteDatabase,
  sql: string,
  params: any[] = []
): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.executeSql(
      sql,
      params,
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

const checkAndUpdateVersion = async (db: SQLiteDatabase): Promise<void> => {
  try {
    const results = await asyncExecuteSQL(db, 'SELECT version FROM DbVersion LIMIT 1');
    const currentVersion = results.rows.length > 0 ? results.rows.item(0).version : 0;

    if (currentVersion < CURRENT_DB_VERSION) {
      await updateDatabase(db, currentVersion);
      await db.executeSql('DELETE FROM DbVersion');
      await db.executeSql('INSERT INTO DbVersion (version) VALUES (?)', [CURRENT_DB_VERSION]);
    }
  } catch (error) {
    throw new Error('Error al comprobar y actualizar la versión de la base de datos: ' + error);
  }
};

const updateDatabase = async (db: SQLiteDatabase, updateFrom: number): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    //Añadir aquí las actualizaciones de la base de datos según la versión
    db.transaction(
      (tx) => {
        if (updateFrom < 2) {
          //Notas versión 2
          // Actualizar el trigger para manejar la eliminación de huchas
          // Ahora se maneja la eliminación de huchas con un trigger que transfiere el saldo a la cuenta general
          // sin necesidad de realizar dos inserciones separadas.
          tx.executeSql(`DROP TRIGGER IF EXISTS handle_hucha_deletion;`);
          tx.executeSql(databaseOperations.createTriggerHandleHuchaDeletion);
        }
      },
      (error) => {
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};


export const wipeDatabase = async (db: SQLiteDatabase): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Elimina todas las tablas existentes.
          tx.executeSql(`DROP TABLE IF EXISTS Movimientos;`);
          tx.executeSql(`DROP TABLE IF EXISTS Huchas;`);
          tx.executeSql(`DROP TABLE IF EXISTS DbVersion;`);
          // Si tienes triggers, también puedes eliminarlos:
          tx.executeSql(`DROP TRIGGER IF EXISTS check_balance_before_insert;`);
          tx.executeSql(`DROP TRIGGER IF EXISTS update_hucha_balance_after_insert;`);
          tx.executeSql(`DROP TRIGGER IF EXISTS handle_hucha_deletion;`);
        },
        (error) => {
          console.error('Error en la transacción wipeDatabase:', error);
          reject(error);
        },
        () => {
          console.log('Base de datos borrada exitosamente.');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('Error al borrar la base de datos:', error);
    throw error;
  }
};