"""
Stage 2: Preprocessing & Chunking
Cleans text and creates overlapping chunks for analysis
"""

from typing import List, Dict


def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove excessive whitespace
    cleaned = " ".join(text.split())
    # Normalize line breaks
    cleaned = cleaned.replace("\n\n\n", "\n\n")
    return cleaned.strip()


def create_chunks(text: str, document_type: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict]:
    """
    Split text into overlapping chunks
    
    Args:
        text: Input text
        document_type: Type of document (business_plan, compliance_policy, legal_structure)
        chunk_size: Size of each chunk in characters
        overlap: Number of characters to overlap between chunks
    
    Returns:
        List of chunk dictionaries with metadata
    """
    cleaned_text = clean_text(text)
    chunks = []
    
    start_pos = 0
    chunk_id = 0
    
    while start_pos < len(cleaned_text):
        end_pos = min(start_pos + chunk_size, len(cleaned_text))
        chunk_text = cleaned_text[start_pos:end_pos]
        
        chunks.append({
            "id": f"{document_type}_chunk_{chunk_id}",
            "text": chunk_text,
            "start_char": start_pos,
            "end_char": end_pos,
            "document_type": document_type
        })
        
        start_pos += chunk_size - overlap
        chunk_id += 1
    
    return chunks


def preprocess_documents(documents: dict) -> List[Dict]:
    """Preprocess and chunk all documents"""
    all_chunks = []
    
    for doc_type, text in documents.items():
        chunks = create_chunks(text, doc_type)
        all_chunks.extend(chunks)
    
    return all_chunks
