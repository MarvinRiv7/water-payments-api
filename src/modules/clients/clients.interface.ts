export interface IClients {
  dui: string;
  nombre: string;
  apellido: string;
  referencia: string
  ultimoMes: number;
  ultimoAnio: number;
  estado: "Activo" | "Desconectado" | "Exonerado";
  pagoTipo: "maximo" | "medio" | "minimo";
  observaciones: string
  mesesAtrasados?: number
}
