"""
Stage 4: Embedding & Semantic Matching
Uses OpenAI embeddings to match document chunks to QCB requirements
"""

import json
from typing import List, Dict
import numpy as np
from openai import OpenAI


# Load QCB requirements
with open("requirements.json", "r") as f:
    QCB_REQUIREMENTS = json.load(f)


def generate_embeddings(texts: List[str], client: OpenAI) -> List[List[float]]:
    """Generate embeddings for a list of texts using OpenAI"""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        raise Exception(f"Error generating embeddings: {str(e)}")


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    a_np = np.array(a)
    b_np = np.array(b)
    
    dot_product = np.dot(a_np, b_np)
    norm_a = np.linalg.norm(a_np)
    norm_b = np.linalg.norm(b_np)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return dot_product / (norm_a * norm_b)


def semantic_match(chunks: List[Dict], rule_matches: List[Dict], rule_coverage: Dict[str, int], client: OpenAI) -> List[Dict]:
    """
    Match chunks to requirements using semantic similarity
    
    Args:
        chunks: Preprocessed text chunks
        rule_matches: Results from rule-based checks
        rule_coverage: Count of rule matches per requirement
        client: OpenAI client
    
    Returns:
        List of requirement evaluations with status
    """
    # Generate embeddings for chunks
    chunk_texts = [chunk["text"] for chunk in chunks]
    chunk_embeddings = generate_embeddings(chunk_texts, client)
    
    # Generate embeddings for requirements
    requirement_texts = [req["requirement"] for req in QCB_REQUIREMENTS]
    requirement_embeddings = generate_embeddings(requirement_texts, client)
    
    # Match each requirement to best chunk
    results = []
    
    for idx, req in enumerate(QCB_REQUIREMENTS):
        req_id = req["id"]
        req_embedding = requirement_embeddings[idx]
        
        # Find best matching chunk
        best_similarity = 0.0
        best_chunk_idx = 0
        
        for chunk_idx, chunk_embedding in enumerate(chunk_embeddings):
            similarity = cosine_similarity(req_embedding, chunk_embedding)
            if similarity > best_similarity:
                best_similarity = similarity
                best_chunk_idx = chunk_idx
        
        # Determine status based on similarity and rule matches
        status = determine_status(best_similarity, req_id, rule_coverage)
        
        # Get matched text
        matched_chunk = chunks[best_chunk_idx]
        matched_text = matched_chunk["text"][:200] + "..." if len(matched_chunk["text"]) > 200 else matched_chunk["text"]
        
        results.append({
            "id": req_id,
            "category": req["category"],
            "requirement": req["requirement"],
            "status": status,
            "similarity_score": best_similarity,
            "matched_text": matched_text,
            "found_in_document": matched_chunk["document_type"],
            "details": generate_details(status, best_similarity, req_id, rule_coverage)
        })
    
    return results


def determine_status(similarity: float, req_id: str, rule_coverage: Dict[str, int]) -> str:
    """Determine compliance status based on similarity and rule matches"""
    has_rule_match = rule_coverage.get(req_id, 0) > 0
    
    # High similarity or strong rule match = compliant
    if similarity > 0.7 or (similarity > 0.5 and has_rule_match):
        return "compliant"
    # Moderate similarity = partial
    elif similarity > 0.4:
        return "partial"
    # Low similarity = missing
    else:
        return "missing"


def generate_details(status: str, similarity: float, req_id: str, rule_coverage: Dict[str, int]) -> str:
    """Generate explanation for the status"""
    rule_count = rule_coverage.get(req_id, 0)
    
    if status == "compliant":
        if rule_count > 0:
            return f"Found {rule_count} relevant mentions. Semantic match score: {similarity:.2f}. Appears to be fully compliant."
        return f"Semantic match score: {similarity:.2f}. Appears to be fully addressed in documents."
    elif status == "partial":
        if rule_count > 0:
            return f"Found {rule_count} mentions but incomplete. Semantic match: {similarity:.2f}. Needs more detail."
        return f"Semantic match: {similarity:.2f}. Partially addressed but lacking completeness."
    else:
        return f"Semantic match: {similarity:.2f}. Not adequately addressed in documents."
