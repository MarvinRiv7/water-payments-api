// src/services/pdf.service.ts
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

export class PdfService {
  static generarFactura(cliente: any, pagos: any[], total: number) {
    const doc = new PDFDocument({ margin: 50 });
    
    // función para dibujar una factura en una posición Y
    const drawFactura = (yOffset: number, copia: string) => {
      doc.fontSize(16).text(" FACTURA DE PAGO DE AGUA", 50, yOffset, { align: "center" });
      doc.fontSize(10).text(`Copia: ${copia}`, 50, yOffset + 25);

      doc.fontSize(12).text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 50, yOffset + 50);
      doc.text(`DUI: ${cliente.dui}`, 50, yOffset + 70);

      doc.moveDown();
      doc.text("Detalle de Pagos:", 50, yOffset + 100);

      let posY = yOffset + 120;
      pagos.forEach((pago: any, i: number) => {
        doc.text(
          `${i + 1}. Mes: ${pago.mes}-${pago.anio} | Monto: $${pago.monto}`,
          50,
          posY
        );
        posY += 20;
      });

      doc.font("Helvetica-Bold").text(`TOTAL: $${total}`, 50, posY + 10);
      doc.font("Helvetica"); // Reset font to normal after

      doc.text(
        `Fecha de emisión: ${dayjs().format("DD/MM/YYYY HH:mm")}`,
        50,
        posY + 40
      );

      // Línea divisoria
      doc.moveTo(50, posY + 70).lineTo(550, posY + 70).stroke();
    };

    // ✅ Imprimir dos copias en la misma hoja
    drawFactura(50, "Cliente");
    drawFactura(400, "Empresa");

    return doc;
  }
}
