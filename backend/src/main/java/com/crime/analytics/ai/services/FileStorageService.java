package com.crime.analytics.ai.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final OcrProcessorService ocrProcessorService;

    public StoredFile saveFile(Long caseId, MultipartFile file) {
        log.info("Saving file {} for case {}", file.getOriginalFilename(), caseId);

        try {
            String dirPath = Paths.get("uploads", caseId.toString()).toString();
            File dir = new File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".") + 1) : "txt";
            String safeName = UUID.randomUUID().toString() + "." + ext;
            String fullPath = Paths.get(dirPath, safeName).toAbsolutePath().toString();

            try (FileOutputStream fos = new FileOutputStream(fullPath)) {
                fos.write(file.getBytes());
            }

            // Genuinely extract text using OCR & document parser
            OcrProcessorService.ExtractedTextResult ocrResult = ocrProcessorService.extractTextFromFile(fullPath, ext);
            String textContent = ocrResult.text();
            double confidence = ocrResult.confidence();

            return new StoredFile(originalName, fullPath, ext, file.getSize(), textContent, confidence);

        } catch (Exception e) {
            log.error("Failed to store file for case {}", caseId, e);
            throw new RuntimeException("Could not store file: " + e.getMessage());
        }
    }

    public record StoredFile(String originalName, String filePath, String fileType, long fileSize, String extractedText, double ocrConfidence) {}
}
