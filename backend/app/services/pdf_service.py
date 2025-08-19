import fitz
from fastapi import UploadFile

from ..config import settings


class PDFService:
    @staticmethod
    async def extract_text_from_pdf(file: UploadFile) -> str:
        """Extract text from uploaded PDF file"""
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    @staticmethod
    def chunk_text(text: str, max_tokens: int = None) -> list:
        """Split text into manageable chunks"""
        if max_tokens is None:
            max_tokens = settings.MAX_TOKENS_PER_CHUNK

        paragraphs = text.split("\n\n")
        chunks = []
        current = ""

        for para in paragraphs:
            if len(current) + len(para) < max_tokens * 4:
                current += para + "\n\n"
            else:
                if current.strip():
                    chunks.append(current.strip())
                current = para + "\n\n"

        if current.strip():
            chunks.append(current.strip())

        return chunks


pdf_service = PDFService()
