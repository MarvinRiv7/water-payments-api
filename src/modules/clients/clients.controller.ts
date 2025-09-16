import { Request, Response } from "express";
import { Client } from "./clients.models";

export const clientsGet = async (req: Request, res: Response) => {
  try {
    const client = await Client.find();
    res.status(200).json({
      client,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Erro al obtenter los clientes",
    });
  }
};

export const clientsPost = async (req: Request, res: Response) => {
  try {
    const { dui, nombre, apellido } = req.body;
    const client = new Client({ dui, nombre, apellido });

    await client.save();
    res.status(201).json({
      client,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Erro al crear clientes",
    });
  }
};
export const clientsPut = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { _id, dui, ...resto } = req.body;
    const client = await Client.findByIdAndUpdate(id, resto, { new: true });
    res.status(200).json({
      client,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error al actualizar",
    });
  }
};
export const clientsDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id)
    res.status(200).json({
      client,
      msg: "Delete",
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error al eliminar",
    });
  }
};

//V7DmO1z9aBGjqB4g
