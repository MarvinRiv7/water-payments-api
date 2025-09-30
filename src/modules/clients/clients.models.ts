import { model, Schema } from "mongoose";
import { IClients } from "./clients.interface";

export const clientsSchema = new Schema<IClients>({
  dui: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  apellido: {
    type: String,
    required: true,
  },
  ultimoMes: {
    type: Number,
    required: true,
  },
  ultimoAnio: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    enum: ["Activo", "Desconectado", "Exonerado"],
    default: "Activo",
    required: true,
  },
  pagoTipo: {
    type: String,
    enum: ["maximo", "medio", "minimo"],
    default: "maximo",
    required: true,
  },
  mesesAtrasados: {
    type: Number,
    default: 0
  }
});

clientsSchema.methods.toJSON = function () {
  const { __v, ...client } = this.toObject();
  return client;
};

export const Client = model<IClients>("Client", clientsSchema);
