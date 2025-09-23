import dayjs from "dayjs";
import { Client } from "../modules/clients/clients.models";
import { Payment } from "../modules/payments/payments.models";
import {
  calcularMonto,
  obtenerSiguienteMes,
  validarMesesConsecutivos,
} from "../utils/payments";

export class PaymentService {
  static async obtenerPagos() {
    return Payment.find().populate("client", "nombre apellido dui estado");
  }
  static async obtenerMesesDisponiblesPorDui(dui: string) {
    const hoy = dayjs();
    const clienteDB = await Client.findOne({ dui }).lean();
    if (!clienteDB) throw new Error("Cliente no encontrado");

    if (
      clienteDB.estado === "Exonerado" ||
      clienteDB.estado === "Desconectado"
    ) {
      throw new Error(
        `El cliente con estado ${clienteDB.estado} no tiene meses disponibles`
      );
    }

    // 🔹 Buscar último pago
    const ultimoPagoDoc = await Payment.findOne({ client: clienteDB._id })
      .sort({ anio: -1, mes: -1 })
      .lean();

    // 🔹 Todos los pagos ya existentes
    const pagos = await Payment.find({ client: clienteDB._id }).lean();
    const mesesPagados = new Set(pagos.map((p) => `${p.anio}-${p.mes}`));

    const ultimoPago = ultimoPagoDoc
      ? dayjs(`${ultimoPagoDoc.anio}-${ultimoPagoDoc.mes}-01`)
      : dayjs(`${clienteDB.ultimoAnio}-${clienteDB.ultimoMes}-01`);

    let { mes: currentMonth, anio: currentYear } = ultimoPagoDoc
      ? obtenerSiguienteMes(ultimoPagoDoc.anio, parseInt(ultimoPagoDoc.mes))
      : obtenerSiguienteMes(clienteDB.ultimoAnio, clienteDB.ultimoMes);

    const mesesDisponibles: any[] = [];

    while (currentYear <= hoy.year() + 2) {
      const mesStr = currentMonth.toString().padStart(2, "0");
      const key = `${currentYear}-${parseInt(mesStr)}`;

      // 🔹 Saltar meses ya pagados
      if (!mesesPagados.has(key)) {
        const baseMonto = calcularMonto(currentYear, mesStr);

        // Detectar mora
        const fechaMes = dayjs(`${currentYear}-${mesStr}-01`).endOf("month");
        const mesesRetraso = hoy.diff(fechaMes, "month");
        const monto =
          fechaMes.isBefore(hoy) && mesesRetraso >= 3 ? 8 : baseMonto;

        mesesDisponibles.push({
          anio: currentYear,
          mes: parseInt(mesStr),
          monto,
        });
      }

      ({ mes: currentMonth, anio: currentYear } = obtenerSiguienteMes(
        currentYear,
        currentMonth
      ));
    }

    return mesesDisponibles;
  }

  // 🔹 Procesar pagos usando DUI
  static async procesarPagosPorDui(
    dui: string,
    meses: { anio: number; mes: number }[]
  ) {
    const hoy = dayjs();
    const clienteDB = await Client.findOne({ dui });
    if (!clienteDB) throw new Error("Cliente no encontrado");

    if (["Exonerado", "Desconectado"].includes(clienteDB.estado)) {
      throw new Error(
        `No se pueden generar cobros para clientes en estado ${clienteDB.estado}`
      );
    }

    const ultimoPagoDoc = await Payment.findOne({ client: clienteDB._id })
      .sort({ anio: -1, mes: -1 })
      .lean();

    const { mes: siguienteMes, anio: siguienteAnio } = ultimoPagoDoc
      ? obtenerSiguienteMes(ultimoPagoDoc.anio, parseInt(ultimoPagoDoc.mes))
      : obtenerSiguienteMes(clienteDB.ultimoAnio, clienteDB.ultimoMes);

    // 🔹 Ordenar meses cronológicamente
    meses.sort((a, b) => (a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio));

    // 🔹 Validación solo bloquea meses **anteriores al siguiente mes**
    const primerMes = meses[0];
    if (
      primerMes.anio < siguienteAnio ||
      (primerMes.anio === siguienteAnio && primerMes.mes < siguienteMes)
    ) {
      throw new Error(
        `Debes pagar primero el mes ${siguienteMes
          .toString()
          .padStart(2, "0")}-${siguienteAnio}`
      );
    }

    validarMesesConsecutivos(
      meses.map((m) => ({
        anio: m.anio,
        mes: m.mes.toString().padStart(2, "0"),
      }))
    );

    const pagos: any[] = [];
    let total = 0;

    for (const { anio, mes } of meses) {
      const mesStr = mes.toString().padStart(2, "0");

      const yaPagado = await Payment.findOne({
        client: clienteDB._id,
        anio,
        mes,
      });
      if (yaPagado)
        throw new Error(`El mes ${mesStr}-${anio} ya fue pagado previamente`);

      const baseMonto = calcularMonto(anio, mesStr);
      const fechaMes = dayjs(`${anio}-${mesStr}-01`).endOf("month");
      const mesesRetraso = hoy.diff(fechaMes, "month");
      const monto = fechaMes.isBefore(hoy) && mesesRetraso >= 3 ? 8 : baseMonto;

      const pago = new Payment({
        client: clienteDB._id,
        mes,
        anio,
        monto,
        fechaPago: hoy.toDate(),
      });
      await pago.save();
      pagos.push(pago);
      total += monto;
    }

    const ultimoPagado = meses[meses.length - 1];
    clienteDB.ultimoMes = ultimoPagado.mes;
    clienteDB.ultimoAnio = ultimoPagado.anio;
    await clienteDB.save();

    const pagoConCliente = await Payment.findById(pagos[0]._id).populate(
      "client",
      "nombre apellido dui estado"
    );
    if (!pagoConCliente) throw new Error("Cliente no encontrado");

    return { pagos, total, cliente: pagoConCliente.client };
  }
}
