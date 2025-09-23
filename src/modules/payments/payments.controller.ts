import { Request, Response } from "express";
import { PaymentService } from "../../services/payments.service";
import { PdfService } from "../../services/pdf.service";
import { Payment } from "./payments.models";

// ✅ Obtener todos los pagos
export const paymentsGet = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentService.obtenerPagos();
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pagos" });
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
    const mesesDisponibles = await PaymentService.obtenerMesesDisponiblesPorDui(dui);
    res.status(200).json({ mesesDisponibles });
  } catch (error: any) {
    res.status(500).json({ msg: error.message || "Error al obtener meses disponibles" });
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
