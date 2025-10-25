"""
Regulatory Navigator & Readiness Evaluator - Hackathon MVP
A PDF processing pipeline for FinTech compliance evaluation
"""

import streamlit as st
import json
import io
import base64
from typing import Dict, List, Tuple
import fitz  # PyMuPDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.colors import HexColor
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=st.secrets.get("OPENAI_API_KEY", ""))

# Load configuration files
with open("requirements.json", "r") as f:
    QCB_REQUIREMENTS = json.load(f)

with open("resource_mapping_data.json", "r") as f:
    RESOURCE_MAPPING = json.load(f)

# Category mapping for documents
CATEGORY_MAP = {
    "business_plan": ["licensing_category", "minimum_capital", "business_continuity"],
    "compliance_policy": ["aml_policy", "compliance_officer", "cdd_procedures", "transaction_monitoring", "sar_filing"],
    "legal_structure": ["key_personnel", "corporate_structure", "data_residency"]
}


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
        st.error(f"Error extracting text from PDF: {str(e)}")
        return ""


def evaluate_compliance(business_plan: str, compliance_policy: str, legal_structure: str) -> Dict:
    """Stage 1: AI Evaluation of all requirements"""
    
    evaluation_prompt = f"""You are an expert regulatory compliance analyst specializing in Qatar Central Bank (QCB) FinTech licensing requirements.

Analyze the provided documentation against these QCB requirements:
{json.dumps(QCB_REQUIREMENTS, indent=2)}

Evaluate each requirement and classify as:
- "compliant": Fully meets the requirement with comprehensive evidence
- "partial": Partially meets the requirement but lacks detail or completeness
- "missing": Does not address the requirement or fundamentally absent

For any "partial" or "missing" status, identify a KEY QUOTE from the source document that best represents what was found (or the closest relevant text).

Documentation to analyze:

BUSINESS PLAN:
{business_plan}

INTERNAL COMPLIANCE POLICY:
{compliance_policy}

LEGAL STRUCTURE DOCUMENT:
{legal_structure}

Return a JSON object with this structure:
{{
  "overall_score": <number 0-100>,
  "requirements": [
    {{
      "id": "<requirement_id>",
      "category": "<category_name>",
      "requirement": "<requirement_title>",
      "status": "compliant|partial|missing",
      "details": "<your reasoning>",
      "key_quote": "<exact quote from source document, if non-compliant>"
    }}
  ],
  "recommendations": ["<general recommendation 1>", "<general recommendation 2>", ...]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a regulatory compliance expert. Return only valid JSON."},
                {"role": "user", "content": evaluation_prompt}
            ],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content
        # Extract JSON from markdown code blocks if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(result_text)
    except Exception as e:
        st.error(f"Error in AI evaluation: {str(e)}")
        return {"overall_score": 0, "requirements": [], "recommendations": []}


def generate_suggestions(requirement: Dict) -> str:
    """Stage 2: Generate improvement suggestions for partial items"""
    
    suggestion_prompt = f"""You are a regulatory compliance advisor. A FinTech startup has PARTIALLY met this QCB requirement:

Requirement: {requirement['requirement']}
Category: {requirement['category']}
Current Status: {requirement['details']}
Key Quote from Document: {requirement.get('key_quote', 'N/A')}

Provide a concise, actionable suggestion (2-3 sentences) on how they can improve their documentation to fully meet this requirement."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": suggestion_prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        st.error(f"Error generating suggestion: {str(e)}")
        return "Unable to generate suggestion at this time."


def map_resources(requirement_id: str) -> List[Dict]:
    """Map resources to a specific requirement"""
    matched = []
    for resource in RESOURCE_MAPPING:
        if requirement_id in resource.get("linked_rule_ids", []):
            matched.append(resource)
    return matched


def _normalize_text(s: str) -> str:
    """Normalize whitespace to improve PDF text searching"""
    try:
        return " ".join((s or "").replace("\n", " ").replace("\r", " ").split())
    except Exception:
        return s or ""


def _find_rects_for_text(page, quote: str):
    """Find precise rectangles for a quote on a PDF page with conservative matching.
    Strategy order:
    1) Exact phrase (case-insensitive, de-hyphenate)
    2) Normalized phrase
    3) Word-based snippets (15, 10, 8, 6 words minimum)

    Returns a list of fitz.Rect covering only the matched spans.
    """
    if not quote or len(quote) < 5:
        return []

    # Prepare robust search flags
    flags = getattr(fitz, "TEXT_IGNORECASE", 0) | getattr(fitz, "TEXT_DEHYPHENATE", 0)

    # 1) Exact phrase
    try:
        rects = page.search_for(quote, flags=flags)
        if rects:
            return rects
    except Exception:
        pass

    # 2) Normalized phrase
    norm = _normalize_text(quote)
    if norm and len(norm) >= 10:
        try:
            rects = page.search_for(norm, flags=flags)
            if rects:
                return rects
        except Exception:
            pass

    # 3) Word-based snippets - only try substantial phrases (6+ words minimum)
    words = quote.split()
    for wlen in [min(15, len(words)), min(10, len(words)), min(8, len(words)), min(6, len(words))]:
        if wlen < 6:  # Don't search for snippets shorter than 6 words
            continue
        snippet = " ".join(words[:wlen])
        try:
            rects = page.search_for(snippet, flags=flags)
            if rects:
                return rects
        except Exception:
            continue

    return []


def annotate_pdf(original_pdf_bytes: bytes, requirements: List[Dict], doc_category: str) -> bytes:
    """Add colored annotations to original PDF based on findings.
    Tries to highlight key quotes; if not found, drops a sticky note on page 1 as a fallback."""
    try:
        pdf_document = fitz.open(stream=original_pdf_bytes, filetype="pdf")

        # Filter requirements for this document category
        relevant_reqs = [r for r in requirements if r["id"] in CATEGORY_MAP.get(doc_category, [])]

        # Simple fallback phrases by requirement id (used if key_quote can't be located)
        fallback_phrases = {
            "aml_policy": ["AML policy", "board-approved AML"],
            "compliance_officer": ["Compliance Officer"],
            "cdd_procedures": ["Customer Due Diligence", "CDD"],
            "transaction_monitoring": ["Transaction Monitoring"],
            "sar_filing": ["Suspicious Activity Reporting", "SAR"],
            "data_residency": ["data stored", "servers", "State of Qatar"],
            "business_continuity": ["Business Continuity", "Disaster Recovery", "RTO", "RPO"],
            "minimum_capital": ["capital", "QAR"],
            "licensing_category": ["PSP", "P2P", "licensing"],
            "key_personnel": ["Board", "CEO", "Compliance Officer"],
            "corporate_structure": ["Articles of Association", "State of Qatar"]
        }

        # We'll also keep track if we had to fallback to notes so we can stack them
        note_y_offset = 72  # start 1 inch from top

        for req in relevant_reqs:
            if req.get("status") == "compliant":
                continue  # Skip compliant items for cleaner output

            key_quote = req.get("key_quote", "") or ""

            # Choose color based on status
            if req.get("status") == "partial":
                color = (1, 1, 0)  # Yellow
                comment = f"⚠️ {req['requirement']}\n\nSuggestion: {req.get('suggestion', 'Needs improvement')}"
            else:  # missing
                color = (1, 0, 0)  # Red
                comment = f"❌ {req['requirement']}\n\nGap: {req.get('details', 'Not provided')}"

            found = False

            # First attempt: search using the key_quote with robust matching (only if meaningful)
            if key_quote and len(key_quote.split()) >= 6:
                for page_num in range(pdf_document.page_count):
                    page = pdf_document[page_num]
                    rects = _find_rects_for_text(page, key_quote)
                    # Filter out header/title regions and very large text (likely headings) for policy docs
                    filtered = []
                    for r in rects:
                        if doc_category == "compliance_policy":
                            if r.y0 <= 120 or (r.y1 - r.y0) >= 28:
                                continue
                        filtered.append(r)
                    if filtered:
                        for r in filtered:
                            hl = page.add_highlight_annot(r)
                            hl.set_colors(stroke=color)  # highlight uses stroke color
                            hl.set_info(content=comment)
                            hl.update()
                        found = True
                        break

            # Second attempt: disabled to avoid false positives from generic terms
            if not found:
                pass

            # Final fallback: drop a sticky note on the first page so the user still sees the finding
            if not found and pdf_document.page_count > 0:
                page0 = pdf_document[0]
                note_point = fitz.Point(72, note_y_offset)
                note = page0.add_text_annot(note_point, comment)
                note.set_colors(stroke=color)
                note.update()
                note_y_offset += 36  # stack notes vertically

        # Save modified PDF to bytes
        output_bytes = pdf_document.write()
        pdf_document.close()
        return output_bytes
    except Exception as e:
        st.error(f"Error annotating PDF: {str(e)}")
        return original_pdf_bytes


def generate_summary_pdf(score: int, requirements: List[Dict], recommendations: List[str]) -> bytes:
    """Generate a professional summary report PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=HexColor('#1a1a4d'),
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#1a1a4d'),
        spaceAfter=12,
        spaceBefore=20
    )
    
    story = []
    
    # Title
    story.append(Paragraph("QCB Compliance Readiness Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Score
    score_color = HexColor('#22c55e') if score >= 70 else HexColor('#eab308') if score >= 40 else HexColor('#ef4444')
    score_style = ParagraphStyle('Score', parent=styles['Normal'], fontSize=18, textColor=score_color, spaceAfter=20)
    story.append(Paragraph(f"Overall Readiness Score: <b>{score}%</b>", score_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Group requirements by category
    categories = {}
    for req in requirements:
        cat = req.get("category", "Other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(req)
    
    # Requirements by category
    story.append(Paragraph("Detailed Compliance Assessment", heading_style))
    
    for category, reqs in categories.items():
        story.append(Paragraph(f"<b>{category.replace('_', ' ').title()}</b>", styles['Heading3']))
        
        for req in reqs:
            # Status symbol
            if req["status"] == "compliant":
                symbol = "✅"
                color = HexColor('#22c55e')
            elif req["status"] == "partial":
                symbol = "⚠️"
                color = HexColor('#eab308')
            else:
                symbol = "❌"
                color = HexColor('#ef4444')
            
            req_style = ParagraphStyle('Req', parent=styles['Normal'], textColor=color, leftIndent=20)
            story.append(Paragraph(f"{symbol} <b>{req['requirement']}</b>", req_style))
            story.append(Paragraph(f"<i>Status: {req['status'].title()}</i>", styles['Normal']))
            story.append(Paragraph(f"Reasoning: {req['details']}", styles['Normal']))
            
            if req.get('suggestion'):
                story.append(Paragraph(f"<b>Improvement Suggestion:</b> {req['suggestion']}", styles['Normal']))
            
            if req.get('resources'):
                story.append(Paragraph("<b>Recommended Resources:</b>", styles['Normal']))
                for resource in req['resources']:
                    story.append(Paragraph(f"• {resource['name']} ({resource['type']}) - {resource['contact']}", styles['Normal']))
            
            story.append(Spacer(1, 0.15*inch))
    
    # General Recommendations
    if recommendations:
        story.append(PageBreak())
        story.append(Paragraph("Key Recommendations", heading_style))
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {rec}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def main():
    st.set_page_config(
        page_title="QCB Regulatory Navigator",
        page_icon="📋",
        layout="wide"
    )
    
    st.title("🏦 QCB Regulatory Navigator & Readiness Evaluator")
    st.markdown("**Upload your 3 core documents for comprehensive compliance evaluation**")
    
    st.divider()
    
    # File uploaders
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("📄 Business Plan")
        business_plan_file = st.file_uploader(
            "Upload Business Plan PDF",
            type=["pdf"],
            key="business_plan",
            help="Your startup's business plan document"
        )
    
    with col2:
        st.subheader("🔒 Compliance Policy")
        compliance_policy_file = st.file_uploader(
            "Upload Internal Compliance Policy PDF",
            type=["pdf"],
            key="compliance_policy",
            help="Your AML/CFT and security policies"
        )
    
    with col3:
        st.subheader("⚖️ Legal Structure")
        legal_structure_file = st.file_uploader(
            "Upload Legal Structure Document PDF",
            type=["pdf"],
            key="legal_structure",
            help="Your articles of association and corporate structure"
        )
    
    st.divider()
    
    # Initialize session state
    if 'results' not in st.session_state:
        st.session_state.results = None
    
    # Evaluate button
    if st.button("🚀 Evaluate Compliance", type="primary", use_container_width=True):
        if not all([business_plan_file, compliance_policy_file, legal_structure_file]):
            st.error("⚠️ Please upload all three PDF documents before proceeding.")
            return
        
        with st.spinner("🔍 Processing documents and analyzing compliance..."):
            # Read file bytes first
            st.info("📖 Reading PDF files...")
            business_plan_bytes = business_plan_file.read()
            compliance_policy_bytes = compliance_policy_file.read()
            legal_structure_bytes = legal_structure_file.read()
            
            # Extract text from bytes
            business_plan_file.seek(0)
            compliance_policy_file.seek(0)
            legal_structure_file.seek(0)
            
            business_plan_text = extract_text_from_pdf(business_plan_file)
            compliance_policy_text = extract_text_from_pdf(compliance_policy_file)
            legal_structure_text = extract_text_from_pdf(legal_structure_file)
            
            # Stage 1: Evaluation
            st.info("🤖 AI Analysis Stage 1: Evaluating requirements...")
            evaluation_result = evaluate_compliance(
                business_plan_text,
                compliance_policy_text,
                legal_structure_text
            )
            
            # Stage 2: Generate suggestions for partial items
            st.info("💡 AI Analysis Stage 2: Generating improvement suggestions...")
            for req in evaluation_result["requirements"]:
                if req["status"] == "partial":
                    req["suggestion"] = generate_suggestions(req)
                    req["resources"] = map_resources(req["id"])
                elif req["status"] == "missing":
                    req["resources"] = map_resources(req["id"])
            
            # Generate PDFs
            st.info("📝 Generating downloadable reports...")
            
            # Annotated PDFs using the bytes we already read
            annotated_bp = annotate_pdf(business_plan_bytes, evaluation_result["requirements"], "business_plan")
            annotated_cp = annotate_pdf(compliance_policy_bytes, evaluation_result["requirements"], "compliance_policy")
            annotated_ls = annotate_pdf(legal_structure_bytes, evaluation_result["requirements"], "legal_structure")
            
            # Summary PDF
            summary_pdf = generate_summary_pdf(
                evaluation_result["overall_score"],
                evaluation_result["requirements"],
                evaluation_result["recommendations"]
            )
            
            # Store results in session state
            st.session_state.results = {
                'score': evaluation_result["overall_score"],
                'annotated_bp': annotated_bp,
                'annotated_cp': annotated_cp,
                'annotated_ls': annotated_ls,
                'summary_pdf': summary_pdf
            }
            
            st.success("✅ Analysis complete! Download your reports below.")
    
    # Display results if available
    if st.session_state.results:
        # Display score
        score = st.session_state.results['score']
        score_color = "🟢" if score >= 70 else "🟡" if score >= 40 else "🔴"
        st.metric("Overall Readiness Score", f"{score}%", delta=f"{score_color}")
        
        st.divider()
        
        # Download buttons
        st.subheader("📥 Download Reports")
        
        col1, col2 = st.columns(2)
        col3, col4 = st.columns(2)
        
        with col1:
            st.download_button(
                label="📄 Download Marked-up Business Plan",
                data=st.session_state.results['annotated_bp'],
                file_name="annotated_business_plan.pdf",
                mime="application/pdf",
                use_container_width=True
            )
        
        with col2:
            st.download_button(
                label="🔒 Download Marked-up Compliance Policy",
                data=st.session_state.results['annotated_cp'],
                file_name="annotated_compliance_policy.pdf",
                mime="application/pdf",
                use_container_width=True
            )
        
        with col3:
            st.download_button(
                label="⚖️ Download Marked-up Legal Structure",
                data=st.session_state.results['annotated_ls'],
                file_name="annotated_legal_structure.pdf",
                mime="application/pdf",
                use_container_width=True
            )
        
        with col4:
            st.download_button(
                label="📊 Download Summary Report",
                data=st.session_state.results['summary_pdf'],
                file_name="compliance_summary_report.pdf",
                mime="application/pdf",
                use_container_width=True,
                type="primary"
            )


if __name__ == "__main__":
    main()
