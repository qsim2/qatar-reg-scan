"""
Stage 6: Report Generation
Generates recommendations and maps resources using AI
"""

import json
from typing import List, Dict
from openai import OpenAI


# Load resource mapping
with open("resource_mapping_data.json", "r") as f:
    RESOURCE_MAPPING = json.load(f)


def map_resources(requirement_id: str) -> List[Dict]:
    """Map resources to a specific requirement"""
    matched = []
    for resource in RESOURCE_MAPPING:
        if requirement_id in resource.get("linked_rule_ids", []):
            matched.append(resource)
    return matched


def generate_ai_suggestions(urgent_gaps: List[Dict], client: OpenAI) -> List[Dict]:
    """Generate AI-powered suggestions for addressing gaps"""
    recommendations = []
    
    for gap in urgent_gaps:
        prompt = f"""You are a regulatory compliance advisor for Qatar Central Bank (QCB) FinTech licensing.

A startup has a compliance gap:
- Requirement: {gap['requirement']}
- Category: {gap['category']}
- Current Status: {gap['status']}
- Details: {gap['details']}

Provide a concise, actionable recommendation (2-3 sentences) on how to address this gap and achieve full compliance."""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a regulatory compliance expert. Be specific and actionable."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            suggestion = response.choices[0].message.content.strip()
            
            recommendations.append({
                "requirement_id": gap["id"],
                "requirement": gap["requirement"],
                "category": gap["category"],
                "status": gap["status"],
                "suggestion": suggestion,
                "resources": map_resources(gap["id"])
            })
        except Exception as e:
            recommendations.append({
                "requirement_id": gap["id"],
                "requirement": gap["requirement"],
                "category": gap["category"],
                "status": gap["status"],
                "suggestion": f"Unable to generate suggestion: {str(e)}",
                "resources": map_resources(gap["id"])
            })
    
    return recommendations


def generate_general_recommendations(scoring_result: Dict, client: OpenAI) -> List[str]:
    """Generate overall strategic recommendations"""
    score = scoring_result["overall_score"]
    summary = scoring_result["summary"]
    
    prompt = f"""You are a Qatar Central Bank (QCB) compliance consultant.

A FinTech startup has an overall compliance readiness score of {score}%.

Breakdown:
- Compliant: {summary['compliant']} requirements
- Partial: {summary['partial']} requirements
- Missing: {summary['missing']} requirements

Provide 3-5 strategic recommendations to improve their overall compliance readiness. Be specific and actionable."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a regulatory compliance expert. Provide strategic, high-level recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        content = response.choices[0].message.content.strip()
        # Split into individual recommendations
        recommendations = [r.strip() for r in content.split('\n') if r.strip() and (r.strip()[0].isdigit() or r.strip().startswith('-'))]
        return recommendations[:5]
    except Exception:
        return [
            "Focus on addressing critical requirements first (capital, data residency, AML)",
            "Ensure all documentation is complete and properly formatted",
            "Schedule a pre-application consultation with QCB"
        ]
