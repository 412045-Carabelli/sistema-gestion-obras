package com.reportes.service.pdf;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import com.reportes.config.EmpresaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PdfBuilder {

    private final EmpresaConfig empresaConfig;

    /**
     * Crea un documento PDF y retorna el Document para agregar contenido.
     * El ByteArrayOutputStream debe ser manejado por el caller.
     */
    public Document crearDocumento(ByteArrayOutputStream baos) throws DocumentException, IOException {
        Document doc = new Document(PageSize.A4, 20, 20, 80, 60);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        // Agregar membrete
        agregarMembrete(doc);

        return doc;
    }

    /**
     * Agrega el membrete (solo logo 100% ancho).
     */
    private void agregarMembrete(Document doc) throws DocumentException, IOException {
        // Tabla de ancho completo: 1 columna
        PdfPTable membreteTable = new PdfPTable(1);
        membreteTable.setWidthPercentage(100);
        membreteTable.setSpacingAfter(12);

        // Celda del logo (100% ancho)
        PdfPCell cellLogo = new PdfPCell();
        cellLogo.setBorder(PdfPCell.NO_BORDER);
        cellLogo.setHorizontalAlignment(Element.ALIGN_CENTER);
        cellLogo.setPadding(0);

        try {
            Image logo = cargarLogo();
            if (logo != null) {
                logo.scaleToFit(550, 150);
                cellLogo.addElement(logo);
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar logo: {}", e.getMessage());
        }
        membreteTable.addCell(cellLogo);
        doc.add(membreteTable);
    }

    /**
     * Carga el logo desde resources.
     */
    private Image cargarLogo() throws IOException {
        try {
            ClassPathResource resource = new ClassPathResource("static/images/" + empresaConfig.getLogo());
            InputStream is = resource.getInputStream();
            byte[] imageBytes = is.readAllBytes();
            return Image.getInstance(imageBytes);
        } catch (Exception e) {
            log.warn("Logo no encontrado: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Crea una tabla con encabezados grises y datos alternados.
     */
    public PdfPTable crearTabla(float[] widths, List<String> encabezados, List<List<String>> filas) {
        PdfPTable table = new PdfPTable(widths);
        table.setTotalWidth(500);
        table.setLockedWidth(true);
        table.setSpacingAfter(16);

        // Encabezados
        for (String header : encabezados) {
            PdfPCell cell = new PdfPCell(new Phrase(header, new Font(Font.HELVETICA, 9, Font.BOLD)));
            cell.setBackgroundColor(new Color(243, 244, 246));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(5);
            table.addCell(cell);
        }

        // Filas de datos
        boolean alternate = false;
        for (List<String> fila : filas) {
            alternate = !alternate;
            Color bgColor = alternate ? new Color(249, 250, 251) : Color.WHITE;

            for (int i = 0; i < fila.size(); i++) {
                String valor = fila.get(i);
                boolean esNumero = i > 0 && valor != null && valor.matches(".*[0-9].*");

                PdfPCell cell = new PdfPCell(new Phrase(valor != null ? valor : "—", new Font(Font.HELVETICA, 9)));
                cell.setBackgroundColor(bgColor);
                cell.setHorizontalAlignment(esNumero ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(5);
                table.addCell(cell);
            }
        }

        return table;
    }

    /**
     * Crea una tabla de totales/saldos (derecha alineada).
     */
    public PdfPTable crearTablaTotales(List<String[]> filas) {
        PdfPTable table = new PdfPTable(new float[]{2, 1});
        table.setTotalWidth(300);
        table.setLockedWidth(true);
        table.setSpacingAfter(12);

        for (String[] fila : filas) {
            PdfPCell labelCell = new PdfPCell(new Phrase(fila[0], new Font(Font.HELVETICA, 9)));
            labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            labelCell.setBorder(PdfPCell.NO_BORDER);
            labelCell.setPadding(5);

            PdfPCell valorCell = new PdfPCell(new Phrase(fila[1],
                new Font(Font.HELVETICA, 9, Font.BOLD)));
            valorCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            valorCell.setBorder(PdfPCell.NO_BORDER);
            valorCell.setPadding(5);

            table.addCell(labelCell);
            table.addCell(valorCell);
        }

        return table;
    }

    /**
     * Formatea un BigDecimal como moneda ARS.
     */
    public String formatMoneda(BigDecimal valor) {
        if (valor == null) valor = BigDecimal.ZERO;
        DecimalFormat df = new DecimalFormat("$#,##0.00");
        return df.format(valor);
    }

    /**
     * Retorna la fecha actual formateada (dd/MM/yyyy).
     */
    public String getFechaHoy() {
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
        return sdf.format(new Date());
    }

    /**
     * Agrega un título de sección.
     */
    public Paragraph crearTituloSeccion(String texto) {
        Paragraph p = new Paragraph(texto);
        p.setFont(new Font(Font.HELVETICA, 12, Font.BOLD));
        p.setSpacingBefore(12);
        p.setSpacingAfter(6);
        return p;
    }

    /**
     * Agrega un párrafo centrado.
     */
    private void addCenteredParagraph(Document doc, String text, int fontSize, float spacing)
            throws DocumentException {
        Paragraph p = new Paragraph(text);
        p.setFont(new Font(Font.HELVETICA, fontSize, Font.NORMAL));
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(spacing);
        doc.add(p);
    }
}
