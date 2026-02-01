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

    // 📅 Fecha límite: hoy - 3 meses
    const fechaLimite = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);

    const mesLimite = fechaLimite.getMonth() + 1; // 1-12
    const anioLimite = fechaLimite.getFullYear();

    // 🚫 Estados que NO pueden estar atrasados
    const estadosNoAtrasables = ["Desconectado", "Exonerado"];

    // 🔴 ATRASADOS (solo ACTIVOS)
    const totalAtrasados = await Client.countDocuments({
      estado: { $nin: estadosNoAtrasables },
      $or: [
        { ultimoAnio: { $lt: anioLimite } },
        {
          ultimoAnio: anioLimite,
          ultimoMes: { $lte: mesLimite },
        },
      ],
    });

    // 🟢 AL DÍA
    const totalAlDia = await Client.countDocuments({
      $or: [
        // Exonerados o Desconectados siempre al día
        { estado: { $in: estadosNoAtrasables } },

        // Activos con pagos recientes
        {
          estado: { $nin: estadosNoAtrasables },
          $or: [
            { ultimoAnio: { $gt: anioLimite } },
            {
              ultimoAnio: anioLimite,
              ultimoMes: { $gt: mesLimite },
            },
          ],
        },
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

export const getClientStatusStats = async (req: Request, res: Response) => {
  try {
    const [activos, exonerados, desconectados] = await Promise.all([
      Client.countDocuments({ estado: "Activo" }),
      Client.countDocuments({ estado: "Exonerado" }),
      Client.countDocuments({ estado: "Desconectado" }),
    ]);

    res.status(200).json({
      activos,
      exonerados,
      desconectados,
      total: activos + exonerados + desconectados,
    });
  } catch (error) {
    console.error("Error en getClientStatusStats:", error);
    res.status(500).json({
      msg: "Error al obtener estadísticas de estado de clientes",
    });
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
  res: Response,
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
      mesesAtrasados,
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
      mesesAtrasados: 0,
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
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, referencia, estado, pagoTipo, observaciones } =
      req.body;

    // 🔹 Logs para depuración
    console.log("➡️ PUT /clients/:id");
    console.log("ID recibido:", id);
    console.log("Body recibido:", req.body);

    const dataToUpdate = {
      nombre,
      apellido,
      referencia,
      estado,
      pagoTipo,
      observaciones,
    };

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
