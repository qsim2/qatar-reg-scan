"""
Accuracy Testing Framework for QCB Compliance Evaluator
Measures 4 KPIs: Regulatory Mapping, Gap Analysis, Scoring Logic, Recommendations
"""

import json
import sys
from typing import Dict, List, Tuple
from collections import defaultdict
from openai import OpenAI

# Import functions from main app
from app import evaluate_compliance, generate_suggestions, map_resources

client = OpenAI(api_key="")  # Set via environment or secrets


def load_ground_truth(filepath: str) -> Dict:
    """Load ground truth test dataset"""
    with open(filepath, 'r') as f:
        return json.load(f)


def calculate_f1_recall(predicted: List[Dict], ground_truth: List[Dict]) -> Tuple[float, float, float]:
    """
    Calculate F1 Score and Recall for requirement extraction
    KPI 1: Regulatory Mapping (NLP/RAG) - 10%
    """
    # Create sets of requirement IDs
    pred_ids = {req['id'] for req in predicted}
    truth_ids = {req['id'] for req in ground_truth}
    
    # True Positives: correctly identified requirements
    tp = len(pred_ids & truth_ids)
    # False Positives: predicted but not in ground truth
    fp = len(pred_ids - truth_ids)
    # False Negatives: in ground truth but not predicted
    fn = len(truth_ids - pred_ids)
    
    # Calculate metrics
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return f1, recall, precision


def calculate_gap_flagging_precision(predicted: List[Dict], ground_truth: List[Dict]) -> float:
    """
    Calculate precision on gap/risk flagging
    KPI 2: Gap Analysis (Classification) - 5%
    Measures accuracy of flagging compliance deficiencies without false positives
    """
    # Build ground truth gap set (missing or partial)
    truth_gaps = {
        req['id'] for req in ground_truth 
        if req.get('status') in ['missing', 'partial']
    }
    
    # Build predicted gap set
    pred_gaps = {
        req['id'] for req in predicted 
        if req.get('status') in ['missing', 'partial']
    }
    
    # True Positives: correctly flagged gaps
    tp = len(pred_gaps & truth_gaps)
    # False Positives: flagged as gap but compliant in ground truth
    fp = len(pred_gaps - truth_gaps)
    
    # Precision = TP / (TP + FP)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    
    return precision


def evaluate_scoring_transparency(predicted_score: int, ground_truth_score: int, 
                                   predicted_reqs: List[Dict], truth_reqs: List[Dict]) -> Dict:
    """
    Evaluate scoring logic transparency and accuracy
    KPI 3: Readiness Scorecard (Scoring Logic) - 5%
    """
    # Score accuracy
    score_diff = abs(predicted_score - ground_truth_score)
    score_accuracy = max(0, 1 - (score_diff / 100))  # Normalized to 0-1
    
    # Check critical gap weighting (e.g., capital, data residency)
    critical_reqs = ['minimum_capital_psp', 'minimum_capital_p2p', 'minimum_capital_wealth', 
                     'data_residency', 'primary_data_environment', 'aml_policy']
    
    # Count critical gaps correctly identified
    truth_critical_gaps = {
        req['id'] for req in truth_reqs 
        if req['id'] in critical_reqs and req.get('status') in ['missing', 'partial']
    }
    pred_critical_gaps = {
        req['id'] for req in predicted_reqs 
        if req['id'] in critical_reqs and req.get('status') in ['missing', 'partial']
    }
    
    critical_accuracy = len(truth_critical_gaps & pred_critical_gaps) / len(truth_critical_gaps) if truth_critical_gaps else 1.0
    
    return {
        'score_accuracy': score_accuracy,
        'critical_gap_accuracy': critical_accuracy,
        'combined_score': (score_accuracy + critical_accuracy) / 2,
        'score_diff': score_diff
    }


def evaluate_recommendations(predicted_reqs: List[Dict], truth_reqs: List[Dict]) -> Dict:
    """
    Evaluate recommendation quality and resource mapping accuracy
    KPI 4: Actionable Recommendations - 5%
    """
    # Check if suggestions were generated for partial requirements
    pred_partial = [req for req in predicted_reqs if req.get('status') == 'partial']
    suggestions_provided = sum(1 for req in pred_partial if req.get('suggestion'))
    suggestion_rate = suggestions_provided / len(pred_partial) if pred_partial else 0
    
    # Check resource mapping accuracy
    pred_with_resources = [req for req in predicted_reqs if req.get('status') in ['missing', 'partial']]
    resources_provided = sum(1 for req in pred_with_resources if req.get('resources'))
    resource_mapping_rate = resources_provided / len(pred_with_resources) if pred_with_resources else 0
    
    # Combined recommendation quality score
    recommendation_score = (suggestion_rate + resource_mapping_rate) / 2
    
    return {
        'suggestion_rate': suggestion_rate,
        'resource_mapping_rate': resource_mapping_rate,
        'recommendation_score': recommendation_score,
        'suggestions_count': suggestions_provided,
        'resources_count': resources_provided
    }


def run_test_case(test_case: Dict) -> Dict:
    """Run evaluation on a single test case"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_case['name']}")
    print(f"{'='*60}")
    
    # Extract documents
    business_plan = test_case['documents']['business_plan']
    compliance_policy = test_case['documents']['compliance_policy']
    legal_structure = test_case['documents']['legal_structure']
    
    # Run AI evaluation
    print("Running AI evaluation...")
    evaluation_result = evaluate_compliance(business_plan, compliance_policy, legal_structure)
    
    # Generate suggestions for partial items
    print("Generating suggestions...")
    for req in evaluation_result["requirements"]:
        if req["status"] == "partial":
            req["suggestion"] = generate_suggestions(req)
            req["resources"] = map_resources(req["id"])
        elif req["status"] == "missing":
            req["resources"] = map_resources(req["id"])
    
    # Ground truth
    ground_truth = test_case['ground_truth']
    
    # Calculate KPIs
    print("\nCalculating KPIs...")
    
    # KPI 1: Regulatory Mapping (F1/Recall) - 10%
    f1, recall, mapping_precision = calculate_f1_recall(
        evaluation_result['requirements'], 
        ground_truth['requirements']
    )
    kpi1_score = (f1 + recall) / 2  # Average of F1 and Recall
    
    # KPI 2: Gap Analysis (Precision) - 5%
    gap_precision = calculate_gap_flagging_precision(
        evaluation_result['requirements'],
        ground_truth['requirements']
    )
    kpi2_score = gap_precision
    
    # KPI 3: Scoring Transparency - 5%
    scoring_eval = evaluate_scoring_transparency(
        evaluation_result['overall_score'],
        ground_truth['overall_score'],
        evaluation_result['requirements'],
        ground_truth['requirements']
    )
    kpi3_score = scoring_eval['combined_score']
    
    # KPI 4: Recommendations - 5%
    rec_eval = evaluate_recommendations(
        evaluation_result['requirements'],
        ground_truth['requirements']
    )
    kpi4_score = rec_eval['recommendation_score']
    
    # Weighted total (out of 25%)
    weighted_total = (kpi1_score * 0.10 + kpi2_score * 0.05 + 
                     kpi3_score * 0.05 + kpi4_score * 0.05)
    
    results = {
        'test_case': test_case['name'],
        'kpi1_regulatory_mapping': {
            'f1_score': f1,
            'recall': recall,
            'precision': mapping_precision,
            'weighted_score': kpi1_score * 0.10,
            'target_weight': '10%'
        },
        'kpi2_gap_analysis': {
            'precision': gap_precision,
            'weighted_score': kpi2_score * 0.05,
            'target_weight': '5%'
        },
        'kpi3_scoring_transparency': {
            'score_accuracy': scoring_eval['score_accuracy'],
            'critical_gap_accuracy': scoring_eval['critical_gap_accuracy'],
            'score_diff': scoring_eval['score_diff'],
            'weighted_score': kpi3_score * 0.05,
            'target_weight': '5%'
        },
        'kpi4_recommendations': {
            'suggestion_rate': rec_eval['suggestion_rate'],
            'resource_mapping_rate': rec_eval['resource_mapping_rate'],
            'weighted_score': kpi4_score * 0.05,
            'target_weight': '5%'
        },
        'total_weighted_score': weighted_total,
        'total_percentage': f"{weighted_total * 100:.2f}%",
        'predicted_score': evaluation_result['overall_score'],
        'ground_truth_score': ground_truth['overall_score']
    }
    
    return results


def print_results(all_results: List[Dict]):
    """Print formatted results report"""
    print("\n" + "="*80)
    print("ACCURACY TEST RESULTS - QCB COMPLIANCE EVALUATOR")
    print("="*80)
    
    # Calculate averages
    avg_kpi1 = sum(r['kpi1_regulatory_mapping']['weighted_score'] for r in all_results) / len(all_results)
    avg_kpi2 = sum(r['kpi2_gap_analysis']['weighted_score'] for r in all_results) / len(all_results)
    avg_kpi3 = sum(r['kpi3_scoring_transparency']['weighted_score'] for r in all_results) / len(all_results)
    avg_kpi4 = sum(r['kpi4_recommendations']['weighted_score'] for r in all_results) / len(all_results)
    avg_total = sum(r['total_weighted_score'] for r in all_results) / len(all_results)
    
    print(f"\nTEST CASES RUN: {len(all_results)}")
    print("\n" + "-"*80)
    print("AVERAGE SCORES BY KPI:")
    print("-"*80)
    print(f"KPI 1: Regulatory Mapping (F1/Recall)     {avg_kpi1*100:6.2f}% / 10.00% target")
    print(f"KPI 2: Gap Analysis (Precision)           {avg_kpi2*100:6.2f}% /  5.00% target")
    print(f"KPI 3: Scoring Transparency               {avg_kpi3*100:6.2f}% /  5.00% target")
    print(f"KPI 4: Recommendation Quality             {avg_kpi4*100:6.2f}% /  5.00% target")
    print("-"*80)
    print(f"TOTAL WEIGHTED SCORE:                     {avg_total*100:6.2f}% / 25.00% target")
    print("="*80)
    
    # Detailed per test case
    print("\nDETAILED RESULTS BY TEST CASE:")
    print("-"*80)
    for result in all_results:
        print(f"\n{result['test_case']}")
        print(f"  Predicted Score: {result['predicted_score']}% | Ground Truth: {result['ground_truth_score']}%")
        print(f"  KPI 1 (Regulatory Mapping):")
        print(f"    F1: {result['kpi1_regulatory_mapping']['f1_score']:.3f} | Recall: {result['kpi1_regulatory_mapping']['recall']:.3f}")
        print(f"    Weighted: {result['kpi1_regulatory_mapping']['weighted_score']*100:.2f}%")
        print(f"  KPI 2 (Gap Precision): {result['kpi2_gap_analysis']['precision']:.3f} | Weighted: {result['kpi2_gap_analysis']['weighted_score']*100:.2f}%")
        print(f"  KPI 3 (Scoring): Score Diff={result['kpi3_scoring_transparency']['score_diff']} | Weighted: {result['kpi3_scoring_transparency']['weighted_score']*100:.2f}%")
        print(f"  KPI 4 (Recommendations): {result['kpi4_recommendations']['weighted_score']*100:.2f}%")
        print(f"  TOTAL: {result['total_weighted_score']*100:.2f}%")
    
    print("\n" + "="*80)


def main():
    """Main test execution"""
    if len(sys.argv) < 2:
        print("Usage: python test_accuracy.py <test_data.json>")
        print("Example: python test_accuracy.py test_data_sample.json")
        sys.exit(1)
    
    test_file = sys.argv[1]
    
    try:
        print(f"Loading test data from {test_file}...")
        test_data = load_ground_truth(test_file)
        
        all_results = []
        for test_case in test_data['test_cases']:
            result = run_test_case(test_case)
            all_results.append(result)
        
        print_results(all_results)
        
        # Save detailed results to JSON
        output_file = "test_results.json"
        with open(output_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f"\nDetailed results saved to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Test file '{test_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
