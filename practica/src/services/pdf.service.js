import PDFDocument from 'pdfkit';

const line = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value || '-');
};

export const generateDeliveryNotePdf = (deliveryNote) => new Promise((resolve, reject) => {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const user = deliveryNote.user || {};
    const client = deliveryNote.client || {};
    const project = deliveryNote.project || {};
    const company = deliveryNote.company || user.company || {};

    doc.fontSize(22).font('Helvetica-Bold').text('Albarán BildyApp', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Datos de la compañía');
    doc.fontSize(11);
    line(doc, 'Nombre', company.name);
    line(doc, 'CIF/NIF', company.cif);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Datos del usuario');
    doc.fontSize(11);
    line(doc, 'Nombre', user.fullName || [user.name, user.lastName].filter(Boolean).join(' '));
    line(doc, 'Email', user.email);
    line(doc, 'NIF', user.nif);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Datos del cliente');
    doc.fontSize(11);
    line(doc, 'Nombre', client.name);
    line(doc, 'CIF/NIF', client.cif);
    line(doc, 'Email', client.email);
    line(doc, 'Teléfono', client.phone);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Datos del proyecto');
    doc.fontSize(11);
    line(doc, 'Nombre', project.name);
    line(doc, 'Código', project.projectCode);
    line(doc, 'Email', project.email);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Detalle del albarán');
    doc.fontSize(11);
    line(doc, 'Fecha de trabajo', deliveryNote.workDate ? new Date(deliveryNote.workDate).toLocaleDateString('es-ES') : '-');
    line(doc, 'Formato', deliveryNote.format === 'hours' ? 'Horas' : 'Material');
    line(doc, 'Descripción', deliveryNote.description);

    if (deliveryNote.format === 'material') {
      line(doc, 'Material', deliveryNote.material);
      line(doc, 'Cantidad', deliveryNote.quantity?.toString());
      line(doc, 'Unidad', deliveryNote.unit);
    } else {
      if (deliveryNote.hours) line(doc, 'Horas totales', deliveryNote.hours.toString());
      if (deliveryNote.workers?.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Trabajadores');
        deliveryNote.workers.forEach((worker) => {
          doc.font('Helvetica').text(`- ${worker.name}: ${worker.hours} horas`);
        });
      }
    }

    doc.moveDown();
    line(doc, 'Firmado', deliveryNote.signed ? 'Sí' : 'No');
    if (deliveryNote.signedAt) line(doc, 'Fecha de firma', new Date(deliveryNote.signedAt).toLocaleString('es-ES'));
    if (deliveryNote.signatureUrl) line(doc, 'URL firma', deliveryNote.signatureUrl);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('gray').text(`Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}`);
    doc.end();
  } catch (error) {
    reject(error);
  }
});
