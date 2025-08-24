import { Request, Response } from "express";

export const clientsGet = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      msg: "Get",
    });
  } catch (error) {
    res.status(500).json({
      msg: "Erro al obtenter los clientes",
    });
  }
};

export const clientsPost = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    res.status(201).json({
      msg: "Post",
      body,
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
    res.status(200).json({
      msg: "Put",
      id,
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
    res.status(200).json({
      msg: "Delete",
      id,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error al eliminar",
    });
  }
};
