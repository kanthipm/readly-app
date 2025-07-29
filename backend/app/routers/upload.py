from fastapi import APIRouter, File, HTTPException, UploadFile

from ..config import settings
from ..models.schemas import UploadResponse
from ..services.knowledge_service import knowledge_service
from ..services.pdf_service import pdf_service
from ..utils.validators import validate_knowledge_map

router = APIRouter()

# Global variable to store uploaded file content
uploaded_file_content = ""


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file to generate knowledge maps"""
    global uploaded_file_content

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Extract text from PDF
        uploaded_file_content = await pdf_service.extract_text_from_pdf(file)

        if not uploaded_file_content.strip():
            raise HTTPException(status_code=400, detail="No text content found in PDF")

        # Split into chunks
        chunks = pdf_service.chunk_text(uploaded_file_content)
        chunks_to_process = chunks[: settings.MAX_CHUNKS]

        knowledge_maps = []
        for i, chunk in enumerate(chunks_to_process):
            print(f"Processing chunk {i+1}/{len(chunks_to_process)}")
            map_json = knowledge_service.generate_knowledge_map(chunk)

            if validate_knowledge_map(map_json):
                knowledge_maps.append(map_json)
            else:
                print(f"Skipping invalid map for chunk {i+1}")

        return UploadResponse(
            maps=knowledge_maps,
            message=f"Successfully processed {len(knowledge_maps)} knowledge maps",
            chunks_processed=len(chunks_to_process),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
