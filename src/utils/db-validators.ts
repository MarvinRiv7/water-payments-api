import { Client } from "../modules/clients/clients.models";

export const existeDUI = async (dui: string = "") => {
  const duiExiste = await Client.findOne({ dui });
  if(duiExiste) {
    throw new Error(`El DUI: ${dui}, ya está registrado en la base de datos`);
  }
};
