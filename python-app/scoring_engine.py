"""
Stage 5: Scoring Engine
Calculates weighted compliance scores with emphasis on critical requirements
"""

from typing import List, Dict


# Critical requirements have higher weight
CRITICAL_REQUIREMENTS = [
    "minimum_capital_psp",
    "minimum_capital_p2p",
    "minimum_capital_wealth",
    "data_residency",
    "primary_data_environment",
    "aml_policy",
]


def calculate_scores(requirements: List[Dict]) -> Dict:
    """
    Calculate weighted compliance score
    
    Args:
        requirements: List of evaluated requirements with status
    
    Returns:
        Dictionary with overall score and detailed breakdown
    """
    total_score = 0
    max_score = 0
    
    scored_requirements = []
    
    for req in requirements:
        req_id = req["id"]
        is_critical = req_id in CRITICAL_REQUIREMENTS
        
        # Weight: critical = 2.0, standard = 1.0
        weight = 2.0 if is_critical else 1.0
        
        # Points based on status
        if req["status"] == "compliant":
            points = 100
        elif req["status"] == "partial":
            points = 50
        else:  # missing
            points = 0
        
        weighted_points = points * weight
        max_points = 100 * weight
        
        total_score += weighted_points
        max_score += max_points
        
        scored_requirements.append({
            **req,
            "points": points,
            "weight": weight,
            "weighted_points": weighted_points,
            "is_critical": is_critical
        })
    
    # Calculate overall percentage
    overall_score = int((total_score / max_score) * 100) if max_score > 0 else 0
    
    # Count by status
    compliant = sum(1 for r in scored_requirements if r["status"] == "compliant")
    partial = sum(1 for r in scored_requirements if r["status"] == "partial")
    missing = sum(1 for r in scored_requirements if r["status"] == "missing")
    
    return {
        "overall_score": overall_score,
        "total_score": total_score,
        "max_score": max_score,
        "requirements": scored_requirements,
        "summary": {
            "compliant": compliant,
            "partial": partial,
            "missing": missing,
            "total": len(scored_requirements)
        }
    }


def identify_urgent_gaps(scored_requirements: List[Dict]) -> List[Dict]:
    """Identify critical missing or partial requirements"""
    urgent = []
    
    for req in scored_requirements:
        if req["is_critical"] and req["status"] in ["missing", "partial"]:
            urgent.append(req)
    
    return urgent
