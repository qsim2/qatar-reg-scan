"""
Stage 3: Rule-based Checks & NER
Applies regex patterns to extract entities and flag potential compliance issues
"""

import re
from typing import List, Dict


# Rule patterns for Named Entity Recognition
RULE_PATTERNS = {
    "capital_amounts": re.compile(r'QAR\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|M))?', re.IGNORECASE),
    "data_residency": re.compile(r'(?:AWS|Azure|GCP|eu-west-1|ap-southeast-1|Ireland|Singapore|cloud|hosted)', re.IGNORECASE),
    "aml_keywords": re.compile(r'(?:AML|Anti-Money Laundering|KYC|Customer Due Diligence|CDD|STR|Suspicious Transaction)', re.IGNORECASE),
    "personnel": re.compile(r'(?:CEO|CFO|CTO|Compliance Officer|Board|Director)', re.IGNORECASE),
    "licensing": re.compile(r'(?:P2P|Marketplace Lending|Payment Service Provider|PSP|Digital Wealth|FinTech)', re.IGNORECASE),
}

# Mapping from rule types to requirement IDs
RULE_TO_REQUIREMENTS = {
    "capital_amounts": ["minimum_capital_psp", "minimum_capital_p2p", "minimum_capital_wealth"],
    "data_residency": ["data_residency", "primary_data_environment"],
    "aml_keywords": ["aml_policy", "kyc_documentation", "cdd_enhanced", "str_reporting"],
    "personnel": ["key_personnel", "compliance_officer"],
    "licensing": ["licensing_category"],
}


def apply_rule_checks(chunks: List[Dict]) -> List[Dict]:
    """
    Apply rule-based pattern matching to chunks
    
    Returns:
        List of rule matches with metadata
    """
    matches = []
    
    for chunk in chunks:
        text = chunk["text"]
        
        for rule_type, pattern in RULE_PATTERNS.items():
            found_matches = pattern.finditer(text)
            
            for match in found_matches:
                matches.append({
                    "rule_type": rule_type,
                    "matched_text": match.group(0),
                    "position": chunk["start_char"] + match.start(),
                    "chunk_id": chunk["id"],
                    "document_type": chunk["document_type"],
                    "requirement_ids": RULE_TO_REQUIREMENTS.get(rule_type, [])
                })
    
    return matches


def get_rule_coverage(rule_matches: List[Dict]) -> Dict[str, int]:
    """Calculate which requirements have rule-based evidence"""
    coverage = {}
    
    for match in rule_matches:
        for req_id in match["requirement_ids"]:
            coverage[req_id] = coverage.get(req_id, 0) + 1
    
    return coverage
