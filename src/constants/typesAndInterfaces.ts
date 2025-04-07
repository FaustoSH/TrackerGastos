export interface Transaction {
    id: number;
    tipo: 'gasto' | 'ingreso';
    cantidad: number;
    saldoPostTransaccion: number;
    descripcion: string;
    fecha: Date;
    hucha_id: number;
}

export interface Hucha {
    id: number;
    nombre: string;
    saldo: number;
    color: string;
    objetivo: number;
    fecha_limite: Date;
}