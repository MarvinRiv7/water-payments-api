import dayjs from "dayjs";
import { Client } from "../clients/clients.models";
import { Payment } from "./payments.models";
import { calcularMonto, obtenerSiguienteMes } from "../../utils/payments";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

export class PaymentService {
  /**
   * 🔹 Helper: calcula monto con o sin mora
   */
  private static calcularMontoConMora(
    anio: number,
    mes: number,
    pagoTipo: "maximo" | "medio" | "minimo",
    mesesAtrasados: number,
    hoy: dayjs.Dayjs
  ) {
    const fechaMes = dayjs(`${anio}-${mes.toString().padStart(2, "0")}-01`);
    const { base, mora } = calcularMonto(
      anio,
      mes.toString().padStart(2, "0"),
      pagoTipo
    );

    let aplicaMora = false;

    // ✅ Aplica mora solo si el mes ya pasó o es actual Y hay 2 o más atrasos
    if (fechaMes.isSameOrBefore(hoy, "month") && mesesAtrasados >= 2) {
      aplicaMora = true;
    }

    return {
      monto: aplicaMora ? base + mora : base,
      aplicaMora,
      fechaMes,
    };
  }

  /**
   * 🔹 Obtener meses disponibles para un cliente
   */
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

    const LIMITE_ANIO = 2028;
    const mesesDisponibles: any[] = [];
    let mesesAtrasados = clienteDB.mesesAtrasados || 0;

    while (currentYear <= LIMITE_ANIO) {
      const key = `${currentYear}-${currentMonth}`;
      const fechaMes = dayjs(`${currentYear}-${currentMonth}-01`);

      if (!mesesPagados.has(key)) {
        const { monto, aplicaMora } = this.calcularMontoConMora(
          currentYear,
          currentMonth,
          clienteDB.pagoTipo,
          mesesAtrasados,
          hoy
        );

        mesesDisponibles.push({
          anio: currentYear,
          mes: currentMonth,
          monto: parseFloat(monto.toFixed(2)),
          tipoPago: clienteDB.pagoTipo,
          moraAplicada: aplicaMora,
        });

        if (fechaMes.isSameOrBefore(hoy, "month")) {
          mesesAtrasados++;
        }
      }

      ({ mes: currentMonth, anio: currentYear } = obtenerSiguienteMes(
        currentYear,
        currentMonth
      ));
    }

    return mesesDisponibles;
  }

  /**
   * 🔹 Procesar pagos de meses seleccionados
   */
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

    // 🔹 Generar lista de meses pendientes
    let mesesPendientes: { anio: number; mes: number }[] = [];
    let nextMes =
      clienteDB.ultimoMes && clienteDB.ultimoAnio
        ? obtenerSiguienteMes(clienteDB.ultimoAnio, clienteDB.ultimoMes)
        : { mes: 1, anio: 2025 };

    while (nextMes.anio <= 2028) {
      const key = `${nextMes.anio}-${nextMes.mes}`;
      if (!mesesPagados.has(key)) {
        mesesPendientes.push({ anio: nextMes.anio, mes: nextMes.mes });
      }
      ({ mes: nextMes.mes, anio: nextMes.anio } = obtenerSiguienteMes(
        nextMes.anio,
        nextMes.mes
      ));
    }

    mesesSeleccionados.sort((a, b) =>
      a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio
    );

    // Validar secuencia de meses
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

    const mesActual = hoy.month() + 1;
    const anioActual = hoy.year();

    for (const { anio, mes } of mesesSeleccionados) {
      const { monto, aplicaMora, fechaMes } = this.calcularMontoConMora(
        anio,
        mes,
        clienteDB.pagoTipo,
        mesesAtrasados,
        hoy
      );

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
        moraAplicada: aplicaMora,
      });

      total += monto;

      if (fechaMes.isSameOrBefore(hoy, "month")) {
        mesesAtrasados++;
      }
    }

    if (pagosGuardados.length > 0) {
      const ultimoPagado = pagosGuardados[pagosGuardados.length - 1];
      const inicioMesActual = dayjs(`${anioActual}-${mesActual}-01`);
      const teniaMoraAlInicio =
        clienteDB.mesesAtrasados && clienteDB.mesesAtrasados >= 2;

      if (
        !teniaMoraAlInicio &&
        (ultimoPagado.anio > anioActual ||
          (ultimoPagado.anio === anioActual && ultimoPagado.mes >= mesActual))
      ) {
        mesesAtrasados = 0;
      }

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
