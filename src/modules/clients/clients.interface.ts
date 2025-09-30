export interface IClients {
  dui: string;
  nombre: string;
  apellido: string;
  ultimoMes: number;
  ultimoAnio: number;
  estado: "Activo" | "Desconectado" | "Exonerado";
  pagoTipo: "maximo" | "medio" | "minimo";
  mesesAtrasados?: number
}
