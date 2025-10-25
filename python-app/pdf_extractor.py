"""
Stage 1: PDF Text Extraction
Extracts raw text from uploaded PDF documents
"""

import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_file) -> str:
    """Extract text content from uploaded PDF file"""
    try:
        pdf_bytes = pdf_file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            text += page.get_text()
        
        pdf_document.close()
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


def extract_all_documents(business_plan_file, compliance_policy_file, legal_structure_file) -> dict:
    """Extract text from all three documents"""
    return {
        "business_plan": extract_text_from_pdf(business_plan_file),
        "compliance_policy": extract_text_from_pdf(compliance_policy_file),
        "legal_structure": extract_text_from_pdf(legal_structure_file)
    }
