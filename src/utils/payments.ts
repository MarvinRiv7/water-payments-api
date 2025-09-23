import dayjs from "dayjs";

// ✅ Calcular monto base (sin mora)
export const calcularMonto = (anio: number, mes: string) => {
  return 7; // monto base fijo
};

// ✅ Obtener siguiente mes/año
export const obtenerSiguienteMes = (anio: number, mes: number) => {
  mes++;
  if (mes > 12) {
    mes = 1;
    anio++;
  }
  return { mes, anio };
};

// ✅ Validar meses consecutivos
export const validarMesesConsecutivos = (
  meses: { anio: number; mes: string }[]
) => {
  for (let i = 1; i < meses.length; i++) {
    const prev = meses[i - 1];
    const current = meses[i];

    let { mes: esperadoMes, anio: esperadoAnio } = obtenerSiguienteMes(
      prev.anio,
      parseInt(prev.mes)
    );

    if (
      parseInt(current.mes) !== esperadoMes ||
      current.anio !== esperadoAnio
    ) {
      throw new Error(
        `Los pagos deben ser consecutivos. Después de ${prev.mes.padStart(
          2,
          "0"
        )}-${prev.anio} sigue ${esperadoMes
          .toString()
          .padStart(2, "0")}-${esperadoAnio}`
      );
    }
  }
};
