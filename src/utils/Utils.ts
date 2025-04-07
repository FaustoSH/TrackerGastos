import { SQLiteDatabase } from "react-native-sqlite-storage";
import { Hucha, Transaction } from "../constants/typesAndInterfaces";
import { asyncExecuteSQL } from "../database/database";

/**
   * Función para manejar cambios en campos de texto.
   * Permite letras, números y espacios, y trunca a maxLength caracteres.
   */
export const handleTextChange = (
    text: string,
    setter: (value: string) => void,
    maxLength: number
): void => {
    const cleaned = text.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, maxLength);
    setter(cleaned);
};

/**
  * Función para manejar cambios en campos numéricos.
  * Elimina caracteres no válidos, permite solo un punto decimal y limita a dos decimales.
  */
export const handleNumericChange = (
    text: string,
    setter: (value: string) => void,
): void => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
        // Conserva el primer punto y elimina los demás
        cleaned =
            cleaned.substring(0, dotIndex + 1) +
            cleaned.substring(dotIndex + 1).replace(/\./g, '');
        // Limita a dos dígitos decimales
        const integerPart = cleaned.substring(0, dotIndex);
        const decimalPart = cleaned.substring(dotIndex + 1, dotIndex + 3);
        cleaned = integerPart + '.' + decimalPart;
    }
    setter(cleaned);
};

export const loadTransactions = async (db: SQLiteDatabase | null, setter: (value: Transaction[]) => void, limitLoad: number): Promise<void> => {
    try {
        if (db) {
            const query = limitLoad && limitLoad > 0 ?
                `SELECT *
           FROM Movimientos
           ORDER BY fecha DESC, id DESC
           LIMIT ${limitLoad};` :
                `SELECT *
           FROM Movimientos
           ORDER BY fecha DESC, id DESC;`
            const results = await asyncExecuteSQL(
                db, query
            );
            if (results) {
                const rows = results.rows;
                const data: Transaction[] = [];
                for (let i = 0; i < rows.length; i++) {
                    data.push(rows.item(i));
                }
                setter(data);
            }
        }
    } catch (error) {
        throw error;
    }
};

export const loadHuchas = async (db: SQLiteDatabase | null, setter: (value: Hucha[]) => void): Promise<void> => {
    try {
        if (db) {
            const results = await asyncExecuteSQL(
                db,
                `SELECT *
           FROM Huchas
           ORDER BY nombre ASC;`
            );
            if (results) {
                const rows = results.rows;
                const data: Hucha[] = [];
                for (let i = 0; i < rows.length; i++) {
                    const item = rows.item(i);
                    data.push({
                        ...item,
                        fecha_limite: item.fecha_limite ? new Date(item.fecha_limite) : null,
                    });
                }
                setter(data);
            }
        }
    } catch (error) {
        throw error;
    }
};