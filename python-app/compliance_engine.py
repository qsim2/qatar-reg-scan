"""
Core compliance evaluation logic - independent of Streamlit
Shared by both the Streamlit app and test scripts
"""

import json
from typing import Dict, List
from openai import OpenAI

# Load configuration files
with open("requirements.json", "r") as f:
    QCB_REQUIREMENTS = json.load(f)

with open("resource_mapping_data.json", "r") as f:
    RESOURCE_MAPPING = json.load(f)


def evaluate_compliance(business_plan: str, compliance_policy: str, legal_structure: str, api_key: str = "") -> Dict:
    """Stage 1: AI Evaluation of all requirements"""
    
    client = OpenAI(api_key=api_key)
    
    evaluation_prompt = f"""You are an expert regulatory compliance analyst specializing in Qatar Central Bank (QCB) FinTech licensing requirements.

Analyze the provided documentation against these QCB requirements:
{json.dumps(QCB_REQUIREMENTS, indent=2)}

Evaluate each requirement and classify as:
- "compliant": Fully meets the requirement with comprehensive evidence
- "partial": Partially meets the requirement but lacks detail or completeness
- "missing": Does not address the requirement or fundamentally absent

CRITICAL rule for data_residency: If any document mentions hosting on public cloud outside Qatar (e.g., AWS/Azure/GCP, regions like eu-west-1 or ap-southeast-1, Ireland, Singapore) without explicitly stating PII and transactional data are stored on servers physically located in Qatar, mark data_residency as "missing" or "partial" and include the quote about the external hosting.

IMPORTANT: For each requirement, you MUST specify which document contains the relevant information by setting the "found_in_document" field to one of: "business_plan", "compliance_policy", or "legal_structure".

For any "partial" or "missing" status, identify a KEY QUOTE from the SPECIFIC source document where you found related text (or the closest relevant text if nothing was found).

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
      "found_in_document": "business_plan|compliance_policy|legal_structure",
      "key_quote": "<exact quote from the SPECIFIC source document, if non-compliant>"
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
        raise Exception(f"Error in AI evaluation: {str(e)}")


def generate_suggestions(requirement: Dict, api_key: str = "") -> str:
    """Stage 2: Generate improvement suggestions for partial items"""
    
    client = OpenAI(api_key=api_key)
    
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
        raise Exception(f"Error generating suggestion: {str(e)}")


def map_resources(requirement_id: str) -> List[Dict]:
    """Map resources to a specific requirement"""
    matched = []
    for resource in RESOURCE_MAPPING:
        if requirement_id in resource.get("linked_rule_ids", []):
            matched.append(resource)
    return matched
