import dayjs from "dayjs";
import { Client } from "../clients/clients.models";
import { Payment } from "./payments.models";
import { calcularMonto, obtenerSiguienteMes } from "../../utils/payments";

export class PaymentService {
  static async obtenerMesesDisponiblesPorDui(dui: string) {
    const hoy = dayjs();
    const clienteDB = await Client.findOne({ dui }).lean();
    if (!clienteDB) throw new Error("Cliente no encontrado");

    if (["Exonerado", "Desconectado"].includes(clienteDB.estado)) {
      throw new Error(
        `El cliente con estado ${clienteDB.estado} no tiene meses disponibles`
      );
    }

    const pagos = await Payment.find({ client: clienteDB._id }).lean();
    const mesesPagados = new Set(pagos.map((p) => `${p.anio}-${p.mes}`));

    const ultimoPagoDoc = await Payment.findOne({ client: clienteDB._id })
      .sort({ anio: -1, mes: -1 })
      .lean();

    let { mes: currentMonth, anio: currentYear } = ultimoPagoDoc
      ? obtenerSiguienteMes(ultimoPagoDoc.anio, parseInt(ultimoPagoDoc.mes))
      : obtenerSiguienteMes(clienteDB.ultimoAnio, clienteDB.ultimoMes);

    const LIMITE_ANIO = 2027;
    const mesesDisponibles: any[] = [];

    let mesesAtrasados = clienteDB.mesesAtrasados || 0;

    while (currentYear <= LIMITE_ANIO) {
      const key = `${currentYear}-${currentMonth}`;
      const fechaMes = dayjs(
        `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`
      );

      if (!mesesPagados.has(key)) {
        const { base, mora } = calcularMonto(
          currentYear,
          currentMonth.toString().padStart(2, "0"),
          clienteDB.pagoTipo
        );
        // Mora solo si ya acumuló ≥2 atrasos y el mes ya comenzó
        const monto =
          mesesAtrasados >= 2 && !fechaMes.isAfter(hoy, "month")
            ? base + mora
            : base;

        mesesDisponibles.push({
          anio: currentYear,
          mes: currentMonth,
          monto: parseFloat(monto.toFixed(2)),
          tipoPago: clienteDB.pagoTipo,
          moraAplicada: monto > base,
        });

        // Incrementa contador solo si el mes ya pasó o es actual
        if (!fechaMes.isAfter(hoy, "month")) mesesAtrasados++;
      }

      ({ mes: currentMonth, anio: currentYear } = obtenerSiguienteMes(
        currentYear,
        currentMonth
      ));
    }

    return mesesDisponibles;
  }

  static async procesarPagosPorDui(
    dui: string,
    mesesSeleccionados: { anio: number; mes: number }[]
  ) {
    const hoy = dayjs();
    const clienteDB = await Client.findOne({ dui });
    if (!clienteDB) throw new Error("Cliente no encontrado");

    if (["Exonerado", "Desconectado"].includes(clienteDB.estado)) {
      throw new Error(
        `No se pueden generar cobros para clientes en estado ${clienteDB.estado}`
      );
    }

    const pagosExistentes = await Payment.find({
      client: clienteDB._id,
    }).lean();
    const mesesPagados = new Set(
      pagosExistentes.map((p) => `${p.anio}-${p.mes}`)
    );

    // 🔹 Generar todos los meses pendientes, incluyendo futuros
    let mesesPendientes: { anio: number; mes: number }[] = [];
    let nextMes =
      clienteDB.ultimoMes && clienteDB.ultimoAnio
        ? obtenerSiguienteMes(clienteDB.ultimoAnio, clienteDB.ultimoMes)
        : { mes: 1, anio: 2025 };

    while (nextMes.anio <= 2027) {
      const key = `${nextMes.anio}-${nextMes.mes}`;
      if (!mesesPagados.has(key))
        mesesPendientes.push({ anio: nextMes.anio, mes: nextMes.mes });
      ({ mes: nextMes.mes, anio: nextMes.anio } = obtenerSiguienteMes(
        nextMes.anio,
        nextMes.mes
      ));
    }

    // Ordenar meses seleccionados
    mesesSeleccionados.sort((a, b) =>
      a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio
    );

    // 🔹 Validar que no se salten meses atrasados
    for (let i = 0; i < mesesSeleccionados.length; i++) {
      const seleccionado = mesesSeleccionados[i];
      const pendiente = mesesPendientes[i];
      if (
        !pendiente ||
        pendiente.anio !== seleccionado.anio ||
        pendiente.mes !== seleccionado.mes
      ) {
        throw new Error(
          `No se pueden saltar meses. Debe pagar primero ${pendiente?.mes
            .toString()
            .padStart(2, "0")}-${pendiente?.anio}`
        );
      }
    }

    const pagosGuardados: any[] = [];
    let total = 0;
    let mesesAtrasados = clienteDB.mesesAtrasados || 0;

    for (const { anio, mes } of mesesSeleccionados) {
      const fechaMes = dayjs(`${anio}-${mes.toString().padStart(2, "0")}-01`);
      const { base, mora } = calcularMonto(
        anio,
        mes.toString().padStart(2, "0"),
        clienteDB.pagoTipo
      );

      // Aplica mora solo si ya acumuló ≥2 atrasos y el mes ya empezó
      const monto =
        mesesAtrasados >= 2 && !fechaMes.isAfter(hoy, "month")
          ? base + mora
          : base;

      const pago = new Payment({
        client: clienteDB._id,
        anio,
        mes,
        monto: parseFloat(monto.toFixed(2)),
        fechaPago: hoy.toDate(),
      });

      await pago.save();
      mesesPagados.add(`${anio}-${mes}`);

      pagosGuardados.push({
        _id: pago._id,
        anio,
        mes,
        monto: parseFloat(monto.toFixed(2)),
        fechaPago: pago.fechaPago,
        moraAplicada: monto > base,
      });

      total += monto;

      // Incrementa meses atrasados solo si el mes ya pasó o es actual
      if (!fechaMes.isAfter(hoy, "month")) mesesAtrasados++;
    }

    // 🔹 Reiniciar contador si no hay meses pendientes hasta hoy
    const mesesPendientesActualizados = await Payment.find({
      client: clienteDB._id,
      $or: [
        { anio: { $lt: hoy.year() } },
        { anio: hoy.year(), mes: { $lte: hoy.month() + 1 } },
      ],
    }).lean();
    if (mesesPendientesActualizados.length === 0) mesesAtrasados = 0;

    if (pagosGuardados.length > 0) {
      const ultimoPagado = pagosGuardados[pagosGuardados.length - 1];
      clienteDB.ultimoMes = ultimoPagado.mes;
      clienteDB.ultimoAnio = ultimoPagado.anio;
      clienteDB.mesesAtrasados = mesesAtrasados;
      await clienteDB.save();
    }

    const pagoConCliente = await Payment.findById(
      pagosGuardados[0]?._id
    ).populate("client", "nombre apellido dui estado");
    if (!pagoConCliente) throw new Error("Cliente no encontrado");

    return { pagos: pagosGuardados, total, cliente: pagoConCliente.client };
  }
}
