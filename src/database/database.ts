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
            saldo REAL NOT NULL,
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
            saldoPostTransaccion REAL NOT NULL,
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
              WHEN ((SELECT saldo FROM Huchas WHERE id = NEW.hucha_id) - NEW.cantidad) < 0
              THEN RAISE(ABORT, 'No hay suficiente dinero en la hucha')
            END;
          END;

        `);

        tx.executeSql(`
          CREATE TRIGGER IF NOT EXISTS update_hucha_balance_after_insert
          AFTER INSERT ON Movimientos
          WHEN NEW.hucha_id IS NOT NULL
          BEGIN
            -- Actualiza el saldo de la hucha según el tipo de movimiento
            UPDATE Huchas
            SET saldo = CASE NEW.tipo
                          WHEN 'ingreso' THEN saldo + NEW.cantidad
                          WHEN 'gasto' THEN saldo - NEW.cantidad
                        END
            WHERE id = NEW.hucha_id;
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


export const wipeDatabase = async (db: SQLiteDatabase): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Elimina todas las tablas existentes.
          tx.executeSql(`DROP TABLE IF EXISTS Movimientos;`);
          tx.executeSql(`DROP TABLE IF EXISTS Huchas;`);
          // Si tienes triggers, también puedes eliminarlos:
          tx.executeSql(`DROP TRIGGER IF EXISTS check_hucha_balance_before_insert;`);
          tx.executeSql(`DROP TRIGGER IF EXISTS update_hucha_balance_after_insert;`);
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