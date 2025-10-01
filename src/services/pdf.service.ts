// src/services/pdf.service.ts
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class PdfService {
  static generarFactura(cliente: any, pagos: any[], total: number) {
    const doc = new PDFDocument({
      margin: 50,
      size: "LETTER", // Carta
      layout: "portrait", // Vertical
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // función para dibujar una factura en una posición Y
    const drawFactura = (yOffset: number, copia: string) => {
      let posY = yOffset;

      // Título
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("RECIBO DE PAGO AGUA DOMICILIAR ADESCO", 0, posY, { align: "center" });

      posY += 25;
      doc.fontSize(10).font("Helvetica").text(`Copia: ${copia}`, 70, posY);
      posY += 30;

      // Datos cliente
      doc.fontSize(12).text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 70, posY);
      posY += 20;
      doc.text(`DUI: ${cliente.dui}`, 70, posY);
      posY += 40;

      // Detalle de pagos
      doc.font("Helvetica-Bold").text("Detalle de Pagos: Servicio de agua domiciliar", 70, posY);
      posY += 20;
      doc.font("Helvetica");

      pagos.forEach((pago: any, i: number) => {
        doc.text(
          `${i + 1}. - Mes: ${pago.mes}-${pago.anio} | Monto: $${pago.monto}`,
          90,
          posY
        );
        posY += 18;
      });

      // Total
      posY += 15;
      doc.font("Helvetica-Bold").fontSize(13).text(`TOTAL: $${total}`, 70, posY);
      doc.font("Helvetica");

      // Fecha (hora El Salvador)
      posY += 35;
      doc.text(
        `Fecha de emisión: ${dayjs().tz("America/El_Salvador").format("DD/MM/YYYY HH:mm")}`,
        70,
        posY
      );

      // Línea divisoria
      posY += 40;
      doc.moveTo(50, posY).lineTo(pageWidth - 50, posY).stroke();
    };

    // ✅ Imprimir dos copias en la misma hoja
    drawFactura(70, "Cliente");   // Arriba
    drawFactura(pageHeight / 2, "Adesco"); // Centrado abajo

    return doc;
  }
}
