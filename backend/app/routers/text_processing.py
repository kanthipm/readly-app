from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings
from ..models.schemas import UploadResponse
from ..services.knowledge_service import knowledge_service
from ..services.gemini_service import gemini_service
from ..utils.validators import validate_knowledge_map


class TextContentRequest(BaseModel):
    content: str


class ConfigureMapRequest(BaseModel):
    existing_map: str  # JSON string of existing knowledge map
    instructions: str  # Instructions for modification


router = APIRouter()


@router.post("/process-text", response_model=UploadResponse)
async def process_text_content(request: TextContentRequest):
    """Process text content to generate knowledge maps"""
    
    if not getattr(gemini_service, "api_key", None):
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not set. Add it in backend/.env to generate knowledge maps from your content. Get a key at https://makersuite.google.com/app/apikey",
        )

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
        any_fallback = False
        for i, chunk in enumerate(chunks_to_process):
            print(f"Processing text chunk {i+1}/{len(chunks_to_process)}")
            map_json, is_fallback = knowledge_service.generate_knowledge_map(
                chunk,
                instructions=instructions
            )
            if is_fallback:
                any_fallback = True

            if validate_knowledge_map(map_json):
                knowledge_maps.append(map_json)
            else:
                print(f"Skipping invalid map for chunk {i+1}")

        return UploadResponse(
            maps=knowledge_maps,
            message=f"Successfully processed {len(knowledge_maps)} knowledge maps from text content",
            chunks_processed=len(chunks_to_process),
            warning="AI service was temporarily unavailable. This map contains placeholder content; try again for content from your document." if any_fallback else None,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing text content: {str(e)}")


@router.post("/configure-map", response_model=UploadResponse)
async def configure_knowledge_map(request: ConfigureMapRequest):
    """Modify an existing knowledge map based on instructions"""
    
    if not request.instructions.strip():
        raise HTTPException(status_code=400, detail="Instructions cannot be empty")
    
    if not request.existing_map.strip():
        raise HTTPException(status_code=400, detail="Existing map cannot be empty")

    try:
        # Modify the existing knowledge map based on instructions
        modified_map_json = knowledge_service.configure_knowledge_map(
            request.existing_map,
            request.instructions
        )

        if validate_knowledge_map(modified_map_json):
            return UploadResponse(
                maps=[modified_map_json],
                message="Successfully configured knowledge map",
                chunks_processed=1,
            )
        else:
            raise HTTPException(status_code=500, detail="Modified knowledge map is invalid")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error configuring knowledge map: {str(e)}")

