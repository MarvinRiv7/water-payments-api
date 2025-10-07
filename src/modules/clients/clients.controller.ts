import { Request, Response } from "express";
import { Client } from "./clients.models";
import { Payment } from "../payments/payments.models";
import { ClientCreateInput, ClientUpdateInput } from "./schemas/client.schema";

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

export const getClientByDui = async (req: Request, res: Response) => {
  try {
    const { dui } = req.params;
    const client = await Client.findOne({ dui });

    if (!client) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cliente" });
  }
};

export const clientsPost = async (
  req: Request<{}, {}, ClientCreateInput>,
  res: Response
) => {
  try {
    // req.body ya está validado por Zod en el middleware
    const {
      dui,
      nombre,
      apellido,
      referencia,
      ultimoMes,
      ultimoAnio,
      estado,
      pagoTipo,
      observaciones,
      mesesAtrasados
    } = req.body;

    const client = new Client({
      dui,
      nombre,
      apellido,
      referencia,
      ultimoMes,
      ultimoAnio,
      estado,
      pagoTipo,
      observaciones,
      mesesAtrasados: 0
    });
    const duiExiste = await Client.findOne({ dui });
    if (duiExiste) {
      res.status(404).json({
        msg: `Ya existe una persona con este dui ${dui}`,
      });
    }
    await client.save();

    res.status(201).json({ client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear cliente" });
  }
};
export const clientsPut = async (
  req: Request<{ id: string }, {}, Partial<ClientUpdateInput>>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, referencia, estado, pagoTipo, observaciones } = req.body;

    // 🔹 Logs para depuración
    console.log("➡️ PUT /clients/:id");
    console.log("ID recibido:", id);
    console.log("Body recibido:", req.body);

    const dataToUpdate = { nombre, apellido, referencia, estado, pagoTipo, observaciones };

    const client = await Client.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
    });

    if (!client) {
      console.warn("⚠️ Cliente no encontrado con id:", id);
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    res.json({ client });
  } catch (error) {
    console.error("❌ Error en clientsPut:", error);
    res.status(500).json({ msg: "Error al actualizar cliente" });
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
