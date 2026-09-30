package com.crime.analytics.ai.services;

import com.crime.analytics.models.entities.Case;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Slf4j
@Service
public class ReportGeneratorService {

    public String generatePdfReport(Case caseEntity, String investigatorName) {
        log.info("Generating PDF report for case: {}", caseEntity.getCaseNumber());

        try {
            String dirPath = "reports";
            File dir = new File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String filename = "investigation_report_" + caseEntity.getCaseNumber().replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";
            String fullPath = Paths.get(dirPath, filename).toAbsolutePath().toString();

            Document pdfDoc = new Document();
            PdfWriter.getInstance(pdfDoc, new FileOutputStream(fullPath));

            pdfDoc.open();
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            pdfDoc.add(new Paragraph("CRIME INVESTIGATION ASSISTANT REPORT", titleFont));
            pdfDoc.add(new Paragraph("==================================================", titleFont));
            pdfDoc.add(new Paragraph("Case Number: " + caseEntity.getCaseNumber(), textFont));
            pdfDoc.add(new Paragraph("Title: " + caseEntity.getTitle(), textFont));
            pdfDoc.add(new Paragraph("Status: " + caseEntity.getStatus(), textFont));
            pdfDoc.add(new Paragraph("Type: " + caseEntity.getType(), textFont));
            pdfDoc.add(new Paragraph("Investigator: " + investigatorName, textFont));
            pdfDoc.add(new Paragraph("Generated Date: " + LocalDateTime.now().toString(), textFont));
            pdfDoc.add(new Paragraph(" ", textFont));

            pdfDoc.add(new Paragraph("Case Description:", sectionFont));
            pdfDoc.add(new Paragraph(caseEntity.getDescription() != null ? caseEntity.getDescription() : "No description provided.", textFont));
            pdfDoc.add(new Paragraph(" ", textFont));

            pdfDoc.add(new Paragraph("Evidence Summary:", sectionFont));
            pdfDoc.add(new Paragraph("Total Evidence Items: " + caseEntity.getEvidences().size(), textFont));
            pdfDoc.add(new Paragraph("Total Suspects Tracked: " + caseEntity.getSuspects().size(), textFont));
            pdfDoc.add(new Paragraph(" ", textFont));

            pdfDoc.add(new Paragraph("Mandatory Legal Disclaimer:", sectionFont));
            pdfDoc.add(new Paragraph("This report contains AI-assisted investigative hypotheses generated for decision support. All outputs require verification by human law enforcement officials.", textFont));

            pdfDoc.close();
            return fullPath;

        } catch (Exception e) {
            log.error("Failed to generate PDF report", e);
            return null;
        }
    }
}
