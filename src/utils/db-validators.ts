import { Client } from "../modules/clients/clients.models";

export const existeDUI = async (dui: string = "") => {
  const duiExiste = await Client.findOne({ dui });
  if (duiExiste) {
    throw new Error(`El DUI: ${dui}, ya está registrado en la base de datos`);
  }
};

export const existeClientId = async (id: string = "") => {
  const clientExiste = await Client.findById( id );
  if (!clientExiste) {
    throw new Error(`El id ${id} no existe en base de datos`);
  }
};
