from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings
from ..models.schemas import UploadResponse
from ..services.knowledge_service import knowledge_service
from ..utils.validators import validate_knowledge_map


class TextContentRequest(BaseModel):
    content: str


router = APIRouter()


@router.post("/process-text", response_model=UploadResponse)
async def process_text_content(request: TextContentRequest):
    """Process text content to generate knowledge maps"""
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    try:
        # Extract instructions if present (format: "Instructions: ...\n\ncontent")
        content = request.content.strip()
        instructions = None
        
        if content.startswith("Instructions:"):
            parts = content.split("\n\n", 1)
            if len(parts) == 2:
                instructions = parts[0].replace("Instructions:", "").strip()
                content = parts[1].strip()
        
        # Split content into chunks if it's too long
        max_chunk_size = 10000  # characters per chunk
        
        if len(content) <= max_chunk_size:
            chunks = [content]
        else:
            # Simple chunking by splitting on paragraphs
            paragraphs = content.split('\n\n')
            chunks = []
            current_chunk = ""
            
            for paragraph in paragraphs:
                if len(current_chunk + paragraph) <= max_chunk_size:
                    current_chunk += paragraph + "\n\n"
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = paragraph + "\n\n"
            
            if current_chunk:
                chunks.append(current_chunk.strip())

        # Limit number of chunks processed
        chunks_to_process = chunks[:settings.MAX_CHUNKS]
        
        knowledge_maps = []
        for i, chunk in enumerate(chunks_to_process):
            print(f"Processing text chunk {i+1}/{len(chunks_to_process)}")
            map_json = knowledge_service.generate_knowledge_map(
                chunk,
                instructions=instructions
            )

            if validate_knowledge_map(map_json):
                knowledge_maps.append(map_json)
            else:
                print(f"Skipping invalid map for chunk {i+1}")

        return UploadResponse(
            maps=knowledge_maps,
            message=f"Successfully processed {len(knowledge_maps)} knowledge maps from text content",
            chunks_processed=len(chunks_to_process),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing text content: {str(e)}")

