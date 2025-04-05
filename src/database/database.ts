import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

// Habilitar debug (opcional, para ver logs en la consola)
// SQLite.DEBUG(true);
// SQLite.enablePromise(true);

const database_name = "TrackerGastos.db";
const database_version = "1.0";
const database_displayname = "Tracker Gastos Database";
const database_size = 200000;

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
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Huchas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            color TEXT NOT NULL,
            objetivo REAL,
            fecha_limite DATE
          );
        `);
    
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
            cantidad REAL NOT NULL CHECK (cantidad > 0),
            descripcion TEXT,
            fecha DATE NOT NULL,
            hucha_id INTEGER,
            FOREIGN KEY (hucha_id) REFERENCES Huchas(id)
          );
        `);
    
        tx.executeSql(`
          CREATE TRIGGER IF NOT EXISTS check_hucha_balance_before_insert
          BEFORE INSERT ON Movimientos
          WHEN NEW.tipo = 'gasto' AND NEW.hucha_id IS NOT NULL
          BEGIN
            SELECT CASE
              WHEN (
                (SELECT IFNULL(SUM(cantidad), 0) FROM Movimientos 
                 WHERE hucha_id = NEW.hucha_id AND tipo = 'ingreso')
                -
                (SELECT IFNULL(SUM(cantidad), 0) FROM Movimientos 
                 WHERE hucha_id = NEW.hucha_id AND tipo = 'gasto')
                - NEW.cantidad
              ) < 0
              THEN RAISE(ABORT, 'No hay suficiente dinero en la hucha')
            END;
          END;
        `);
      },
      error => {
        reject(error);
      },
      () => {
        resolve();
      });
    });

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
