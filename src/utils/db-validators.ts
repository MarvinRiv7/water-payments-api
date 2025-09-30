import { Request, Response, NextFunction } from "express";
import { Client } from "../modules/clients/clients.models";


export const validateClientExists = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ msg: `El id ${id} no existe en la base de datos` });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al buscar cliente" });
  }
};
