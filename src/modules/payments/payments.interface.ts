import { Types } from "mongoose";

export interface IPayment {
  client: Types.ObjectId;
  mes: string;
  anio: number;
  monto: number;
  fechaPago: Date;
  estado: "pagado" | "pendiente";
}
