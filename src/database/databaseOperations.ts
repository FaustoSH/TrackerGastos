export const databaseOperations = {
  //Version 1
  createHuchasTable: `
          CREATE TABLE IF NOT EXISTS Huchas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            saldo REAL NOT NULL,
            color TEXT NOT NULL,
            objetivo REAL,
            fecha_limite DATE,
            huchaVisible INTEGER DEFAULT 1 CHECK (huchaVisible IN (0, 1))
          );
        `,
  //Version 1
  createMovimientosTable: `
          CREATE TABLE IF NOT EXISTS Movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
            cantidad REAL NOT NULL CHECK (cantidad > 0),
            saldoPostTransaccion REAL NOT NULL,
            descripcion TEXT,
            fecha DATE NOT NULL,
            hucha_id INTEGER,
            modoTransferencia INTEGER DEFAULT 0 CHECK (modoTransferencia IN (0, 1)),
            FOREIGN KEY (hucha_id) REFERENCES Huchas(id)
          );
        `,
  //Version 1
  createDbVersionTable: `
        CREATE TABLE IF NOT EXISTS DbVersion (
          version INTEGER PRIMARY KEY
        );
      `,
    //Version 1
    createTriggerCheckBalanceBeforeInsert: `
          CREATE TRIGGER IF NOT EXISTS check_balance_before_insert
          BEFORE INSERT ON Movimientos
          WHEN NEW.tipo = 'gasto'
              OR (NEW.tipo = 'ingreso' AND NEW.modoTransferencia = 1)
          BEGIN
            SELECT
              CASE
                /* ────────── A. Gasto en una hucha concreta ────────── */
                /* Si el gasto es mayor que el saldo de la hucha, aborta */
                WHEN NEW.tipo = 'gasto'
                    AND NEW.hucha_id IS NOT NULL
                    AND (
                      (SELECT IFNULL(saldo, 0)
                        FROM   Huchas
                        WHERE  id = NEW.hucha_id)
                      - NEW.cantidad
                    ) < 0
                THEN RAISE(ABORT, 'No hay suficiente dinero en la hucha')

                /* ────────── B. Gasto desde el saldo libre ────────── */
                /* Si el gasto es mayor que el saldo libre, aborta */
                WHEN NEW.tipo = 'gasto'
                    AND NEW.hucha_id IS NULL
                    AND (
                      /* saldo libre actual */
                      (SELECT IFNULL(
                              (SELECT saldoPostTransaccion
                                FROM   Movimientos
                                ORDER  BY fecha DESC, id DESC
                                LIMIT  1),
                              0
                            )
                      )
                      - (SELECT IFNULL(SUM(saldo), 0) FROM Huchas)
                      - NEW.cantidad
                    ) < 0
                THEN RAISE(ABORT, 'No hay suficiente dinero fuera de huchas')

                /* ────────── C. Ingreso-transferencia a una hucha ────────── */
                /* Si el ingreso-transferencia es mayor que el saldo libre, aborta */
                WHEN NEW.tipo = 'ingreso'
                    AND NEW.modoTransferencia = 1
                    AND NEW.hucha_id IS NOT NULL
                    AND (
                      /* saldo libre actual */
                      (SELECT IFNULL(
                              (SELECT saldoPostTransaccion
                                FROM   Movimientos
                                ORDER  BY fecha DESC, id DESC
                                LIMIT  1),
                              0
                            )
                      )
                      - (SELECT IFNULL(SUM(saldo), 0) FROM Huchas)
                      - NEW.cantidad
                    ) < 0
                THEN RAISE(ABORT, 'No hay suficiente dinero fuera de huchas')
              END;
          END;

        `,
  //Version 1
  createTriggerUpdateHuchaBalanceAfterInsert: `
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
        `,
  //Version 2
  createTriggerHandleHuchaDeletion: `
              CREATE TRIGGER IF NOT EXISTS handle_hucha_deletion
              AFTER UPDATE ON Huchas
              WHEN NEW.huchaVisible = 0        -- se oculta / "elimina"
                AND OLD.huchaVisible = 1       -- venía de visible
                AND OLD.saldo > 0              -- solo si tiene dinero
              BEGIN
                /* Transferencia del saldo de la hucha al saldo general */
                INSERT INTO Movimientos (
                  tipo, 
                  cantidad, 
                  saldoPostTransaccion,
                  descripcion, 
                  fecha, 
                  hucha_id,
                  modoTransferencia
                )
                VALUES (
                  'gasto',                     -- tipo gasto para sacar de la hucha
                  OLD.saldo,                   -- cantidad a transferir
                  (SELECT COALESCE(           -- el saldo no cambia porque es transferencia
                    (SELECT saldoPostTransaccion
                    FROM   Movimientos
                    ORDER  BY fecha DESC, id DESC
                    LIMIT  1
                    ), 0)),
                  'Transferencia por eliminación de hucha',
                  DATETIME('now'),
                  OLD.id,                      -- hucha origen
                  1                           -- indica que es una transferencia
                );
              END;
            `
};