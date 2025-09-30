import { Request, Response } from "express";
import { PaymentService } from "./payments.service";
import { PdfService } from "../../services/pdf.service";
import { Payment } from "./payments.models";
import dayjs from "dayjs";
import { Client } from "../clients/clients.models";

// ✅ Obtener todos los pagos
export const paymentsGet = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentService.obtenerPagos();
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pagos" });
  }
};

export const pagosPorClienteAnio = async (req: Request, res: Response) => {
  try {
    const { anio, clientId } = req.params;

    if (!anio || isNaN(Number(anio))) {
      return res.status(400).json({ msg: "Año inválido" });
    }

    const pagos = await Payment.find({
      anio: Number(anio),
      client: clientId,
    })
      .populate("client", "nombre apellido dui estado")
      .lean();

    // Ordenar en JS asegurando que `mes` sea numérico
    pagos.sort((a, b) => Number(a.mes) - Number(b.mes));

    const cliente = pagos[0].client;

    const pagosPorMes = pagos.map((p) => ({
      mes: Number(p.mes),
      pago: {
        _id: p._id,
        monto: p.monto,
      },
    }));

    res.status(200).json({
      cliente,
      anio: Number(anio),
      pagos: pagosPorMes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener pagos del cliente por año" });
  }
};

export const clientesAtrasados = async (req: Request, res: Response) => {
  try {
    const hoy = dayjs();
    const mesActual = hoy.month() + 1;
    const anioActual = hoy.year();

    const clientes = await Client.find({ estado: "Activo" }).lean();
    const atrasados: any[] = [];

    for (const cliente of clientes) {
      const ultimoPago = await Payment.findOne({ client: cliente._id })
        .sort({ anio: -1, mes: -1 })
        .lean();

      let lastMes = cliente.ultimoMes;
      let lastAnio = cliente.ultimoAnio;

      if (ultimoPago) {
        lastMes = Number(ultimoPago.mes);
        lastAnio = Number(ultimoPago.anio);
      }

      // Solo contar atraso si el último pago fue antes del mes actual
      if (lastAnio < anioActual || (lastAnio === anioActual && lastMes < mesActual)) {
        const mesesAtraso =
          (anioActual - lastAnio) * 12 + (mesActual - lastMes - 1); // meses completos atrasados

        if (mesesAtraso > 0) { // 🔹 Solo agregar si hay atraso real
          atrasados.push({
            cliente,
            ultimoPago: { mes: lastMes, anio: lastAnio },
            mesesAtraso,
          });
        }
      }
    }

    res.status(200).json({ atrasados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener clientes atrasados" });
  }
};


// Obtener todos los pagos de un año específico
export const pagosPorAnio = async (req: Request, res: Response) => {
  try {
    const { anio } = req.params;

    if (!anio || isNaN(Number(anio))) {
      return res.status(400).json({ msg: "Año inválido" });
    }

    // Buscar todos los pagos del año
    const pagos = await Payment.find({ anio: Number(anio) })
      .populate("client", "nombre apellido dui estado")
      .sort({ "client.nombre": 1, mes: 1 }) // ordenado por cliente y mes
      .lean();

    res.status(200).json({ pagos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener pagos por año" });
  }
};

// ✅ Meses disponibles por DUI
export const obtenerMesesDisponibles = async (req: Request, res: Response) => {
  try {
    const { dui } = req.params;
    const mesesDisponibles = await PaymentService.obtenerMesesDisponiblesPorDui(
      dui
    );
    res.status(200).json({ mesesDisponibles });
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: error.message || "Error al obtener meses disponibles" });
  }
};

// ✅ Pagar meses seleccionados por DUI
export const pagarMesesSeleccionados = async (req: Request, res: Response) => {
  try {
    const { dui } = req.params; // 🔹 Usamos DUI en vez de ID
    const { meses } = req.body;

    const { pagos, total, cliente } = await PaymentService.procesarPagosPorDui(
      dui,
      meses
    );

    // Generar PDF
    const pdfStream = PdfService.generarFactura(cliente, pagos, total);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=factura.pdf");
    pdfStream.pipe(res);
    pdfStream.end();
  } catch (error: any) {
    res.status(400).json({ msg: error.message || "Error al procesar el pago" });
  }
};
