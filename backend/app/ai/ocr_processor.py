"""OCR and document text extraction."""

import io
import os
from pathlib import Path
from typing import Optional


def extract_text_from_file(file_path: str, file_type: str) -> tuple[str, float]:
    """Extract text from uploaded document. Returns (text, confidence)."""
    ext = file_type.lower().lstrip(".")

    try:
        if ext == "txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read(), 1.0

        if ext == "pdf":
            return _extract_pdf(file_path)

        if ext in ("docx", "doc"):
            return _extract_docx(file_path)

        if ext in ("jpg", "jpeg", "png", "bmp", "tiff"):
            return _extract_image_ocr(file_path)

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read(), 0.5
    except Exception as e:
        return f"[Extraction failed: {str(e)}]", 0.0


def _extract_pdf(path: str) -> tuple[str, float]:
    from PyPDF2 import PdfReader
    reader = PdfReader(path)
    text_parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text_parts.append(t)
    text = "\n".join(text_parts)
    if len(text.strip()) < 50:
        return _extract_image_ocr(path)
    return text, 0.9


def _extract_docx(path: str) -> tuple[str, float]:
    from docx import Document
    doc = Document(path)
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return text, 0.95


def _extract_image_ocr(path: str) -> tuple[str, float]:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(path)
        text = pytesseract.image_to_string(img)
        conf = 0.7 if len(text.strip()) > 20 else 0.4
        return text, conf
    except Exception:
        try:
            import easyocr
            reader = easyocr.Reader(["en"], gpu=False)
            results = reader.readtext(path)
            text = " ".join(r[1] for r in results)
            avg_conf = sum(r[2] for r in results) / len(results) if results else 0.0
            return text, avg_conf
        except Exception as e:
            return f"[OCR unavailable: {str(e)}]", 0.0
