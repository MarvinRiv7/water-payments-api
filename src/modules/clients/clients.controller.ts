import { Request, Response } from "express";
import { Client } from "./clients.models";
import { Payment } from "../payments/payments.models";

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

export const getClientStats = async (req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1; // 1-12
    const anioActual = hoy.getFullYear();

    // Al día: último pago >= mes anterior (o año anterior si estamos en enero)
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const totalAlDia = await Client.countDocuments({
      $or: [
        // Pagos posteriores al mes anterior
        { ultimoAnio: { $gt: anioMesAnterior } },
        { ultimoAnio: anioMesAnterior, ultimoMes: { $gte: mesAnterior } },
      ],
    });

    // Atrasados: último pago menor al mes anterior
    const totalAtrasados = await Client.countDocuments({
      $or: [
        { ultimoAnio: { $lt: anioMesAnterior } },
        { ultimoAnio: anioMesAnterior, ultimoMes: { $lt: mesAnterior } },
      ],
    });

    res.json({
      alDia: totalAlDia,
      atrasados: totalAtrasados,
    });
  } catch (error) {
    console.error("Error en getClientStats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

export const clientsPost = async (req: Request, res: Response) => {
  try {
    const { dui, nombre, apellido, ultimoMes, ultimoAnio, estado } = req.body;
    const client = new Client({ dui, nombre, apellido, ultimoMes, ultimoAnio, estado });

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

    // 1️⃣ Borrar todos los pagos del cliente
    await Payment.deleteMany({ client: id });

    // 2️⃣ Borrar el cliente
    const client = await Client.findByIdAndDelete(id);

    res.status(200).json({
      client,
      msg: "Cliente y todos sus pagos eliminados correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al eliminar el cliente o sus pagos",
    });
  }
};


//V7DmO1z9aBGjqB4g
