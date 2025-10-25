"""
Preprocessing script to extract QCB compliance requirements from law PDFs.
Run this locally with all law PDFs in the /laws folder.

Requirements:
- pip install openai PyMuPDF Pillow
- Set OPENAI_API_KEY environment variable
"""

import os
import json
import base64
from pathlib import Path
from typing import List, Dict
import fitz  # PyMuPDF
from PIL import Image
import io
from openai import OpenAI

# Initialize OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LAWS_FOLDER = Path("laws")
OUTPUT_FILE = Path("requirements.json")

def pdf_to_images(pdf_path: Path, max_pages: int = 50) -> List[str]:
    """Convert PDF pages to base64 images for vision model"""
    print(f"Converting {pdf_path.name} to images...")
    images = []
    
    try:
        pdf_document = fitz.open(pdf_path)
        for page_num in range(min(pdf_document.page_count, max_pages)):
            page = pdf_document[page_num]
            # Render page at higher resolution for better OCR
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            images.append(img_base64)
            
        pdf_document.close()
        print(f"  Extracted {len(images)} pages")
        return images
    except Exception as e:
        print(f"  Error: {e}")
        return []

def extract_and_translate_text(images: List[str], filename: str) -> str:
    """Extract text from images and translate if Arabic"""
    print(f"Extracting and translating text from {filename}...")
    
    # Process images in batches (GPT-4o can handle multiple images)
    all_text = []
    batch_size = 10
    
    for i in range(0, len(images), batch_size):
        batch = images[i:i+batch_size]
        print(f"  Processing batch {i//batch_size + 1}/{(len(images)-1)//batch_size + 1}")
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert in reading legal documents. Extract all text from the images. If the text is in Arabic, translate it to English. Preserve the structure and article numbers."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Extract and translate (if Arabic) all text from these pages of {filename}. Maintain article structure."
                    }
                ] + [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img}"
                        }
                    } for img in batch
                ]
            }
        ]
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=4000
            )
            all_text.append(response.choices[0].message.content)
        except Exception as e:
            print(f"  Error in batch: {e}")
            continue
    
    return "\n\n".join(all_text)

def extract_requirements_from_text(legal_text: str, filename: str) -> List[Dict]:
    """Extract structured compliance requirements using GPT-4o"""
    print(f"Extracting requirements from {filename}...")
    
    prompt = f"""You are a regulatory compliance expert analyzing Qatar Central Bank (QCB) FinTech licensing requirements.

Analyze this legal text and extract SPECIFIC, ACTIONABLE compliance requirements for FinTech startups (Payment Service Providers and P2P Lending platforms).

For each requirement, provide:
1. A unique ID (lowercase, underscore-separated, e.g., "minimum_capital")
2. Category (e.g., "Capital Adequacy", "AML/CFT Compliance", "Governance & Personnel")
3. Requirement title (concise, under 50 chars)
4. Detailed description including:
   - Specific article/section reference
   - EXACT requirements (numbers, amounts, timeframes)
   - What documents/evidence are needed
5. Input category: which document type this relates to ("business_plan", "compliance_policy", or "legal_structure")

Focus on:
- Capital requirements (minimum amounts in QAR)
- Personnel requirements (qualifications, background checks)
- Corporate structure (registration, ownership)
- AML/CFT requirements (policies, procedures, systems)
- Data security and residency
- Business continuity and disaster recovery
- Licensing categories and procedures

Be VERY specific - include exact numbers, percentages, and requirements from the law.

Legal Text:
{legal_text[:30000]}  

Return a JSON array of requirements with this structure:
[
  {{
    "id": "unique_id",
    "category": "Category Name",
    "requirement": "Requirement Title",
    "description": "Detailed description with article reference and specific requirements",
    "input_category": "business_plan|compliance_policy|legal_structure"
  }}
]
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a regulatory compliance expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content
        
        # Extract JSON from markdown code blocks if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        requirements = json.loads(result_text)
        print(f"  Extracted {len(requirements)} requirements")
        return requirements
    except Exception as e:
        print(f"  Error extracting requirements: {e}")
        return []

def process_all_laws():
    """Main processing function"""
    print("=" * 80)
    print("QCB Law Requirements Preprocessor")
    print("=" * 80)
    
    if not LAWS_FOLDER.exists():
        print(f"\nError: {LAWS_FOLDER} folder not found!")
        print("Create a 'laws' folder and place all law PDFs inside it.")
        return
    
    pdf_files = list(LAWS_FOLDER.glob("*.pdf"))
    if not pdf_files:
        print(f"\nError: No PDF files found in {LAWS_FOLDER}")
        return
    
    print(f"\nFound {len(pdf_files)} PDF files")
    print("-" * 80)
    
    all_requirements = []
    
    for pdf_file in pdf_files:
        print(f"\n[{pdf_files.index(pdf_file) + 1}/{len(pdf_files)}] Processing: {pdf_file.name}")
        print("-" * 80)
        
        # Step 1: Convert PDF to images
        images = pdf_to_images(pdf_file)
        if not images:
            print("  Skipping due to conversion error")
            continue
        
        # Step 2: Extract and translate text
        text = extract_and_translate_text(images, pdf_file.name)
        if not text:
            print("  Skipping due to extraction error")
            continue
        
        # Optional: Save extracted text for review
        text_file = Path(f"extracted_{pdf_file.stem}.txt")
        with open(text_file, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"  Saved extracted text to {text_file}")
        
        # Step 3: Extract requirements
        requirements = extract_requirements_from_text(text, pdf_file.name)
        all_requirements.extend(requirements)
    
    # Deduplicate and merge similar requirements
    print("\n" + "=" * 80)
    print("Merging and deduplicating requirements...")
    unique_requirements = {}
    for req in all_requirements:
        req_id = req.get("id")
        if req_id not in unique_requirements:
            unique_requirements[req_id] = req
        else:
            # Merge descriptions if duplicate ID found
            existing = unique_requirements[req_id]
            existing["description"] += f"\n\nAdditional info: {req['description']}"
    
    final_requirements = list(unique_requirements.values())
    
    # Save to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_requirements, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ SUCCESS!")
    print(f"Extracted {len(final_requirements)} unique requirements")
    print(f"Saved to: {OUTPUT_FILE}")
    print("\nNext steps:")
    print("1. Review the requirements.json file")
    print("2. Edit/refine any requirements as needed")
    print("3. Copy it to your application folder")
    print("=" * 80)

if __name__ == "__main__":
    process_all_laws()
