"""
QCB Compliance Navigator - Pipeline Architecture
A comprehensive regulatory compliance evaluation system following the architecture:
PDF Extraction → Preprocessing → Rule Checks → Semantic Matching → Scoring → Report Generation
"""

import streamlit as st
from openai import OpenAI

# Import pipeline stages
from pdf_extractor import extract_all_documents
from preprocessor import preprocess_documents
from rule_checker import apply_rule_checks, get_rule_coverage
from semantic_matcher import semantic_match
from scoring_engine import calculate_scores, identify_urgent_gaps
from report_generator import generate_ai_suggestions, generate_general_recommendations


# Page configuration
st.set_page_config(
    page_title="QCB Compliance Navigator",
    page_icon="🏛️",
    layout="wide"
)

# Initialize OpenAI client
client = OpenAI(api_key=st.secrets.get("OPENAI_API_KEY", ""))

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #8B1538 0%, #C19A3C 100%);
        padding: 2rem;
        border-radius: 10px;
        color: white;
        margin-bottom: 2rem;
    }
    .stage-badge {
        background-color: #8B1538;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 1rem;
    }
    .score-display {
        font-size: 4rem;
        font-weight: bold;
        text-align: center;
        margin: 2rem 0;
    }
    .score-high { color: #10b981; }
    .score-medium { color: #f59e0b; }
    .score-low { color: #ef4444; }
</style>
""", unsafe_allow_html=True)


def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🏛️ QCB Compliance Navigator</h1>
        <p>Intelligent Compliance Analysis Pipeline for FinTech Licensing</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar - Upload documents
    with st.sidebar:
        st.header("📄 Document Upload")
        st.markdown("Upload your three required documents:")
        
        business_plan_file = st.file_uploader(
            "Business Plan",
            type="pdf",
            help="Your business plan PDF"
        )
        
        compliance_policy_file = st.file_uploader(
            "Compliance Policy",
            type="pdf",
            help="Internal compliance policy document"
        )
        
        legal_structure_file = st.file_uploader(
            "Legal Structure",
            type="pdf",
            help="Legal structure and corporate documents"
        )
        
        analyze_button = st.button(
            "🚀 Analyze Compliance",
            type="primary",
            use_container_width=True,
            disabled=not (business_plan_file and compliance_policy_file and legal_structure_file)
        )
    
    # Main content area
    if analyze_button and all([business_plan_file, compliance_policy_file, legal_structure_file]):
        run_compliance_pipeline(business_plan_file, compliance_policy_file, legal_structure_file)
    else:
        show_welcome_screen()


def show_welcome_screen():
    """Display welcome screen with pipeline overview"""
    st.markdown("## 🔄 Analysis Pipeline")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        ### Stage 1-2: Extraction & Preprocessing
        - 📄 PDF text extraction
        - ✂️ Text chunking with overlap
        - 🧹 Text normalization
        """)
    
    with col2:
        st.markdown("""
        ### Stage 3-4: Analysis
        - 🔍 Rule-based NER checks
        - 🧠 Semantic embedding matching
        - 🎯 Requirement identification
        """)
    
    with col3:
        st.markdown("""
        ### Stage 5-6: Scoring & Report
        - 📊 Weighted scoring engine
        - 💡 AI-powered recommendations
        - 🗺️ Resource mapping
        """)
    
    st.info("👆 Upload your three documents in the sidebar to begin analysis")


def run_compliance_pipeline(business_plan_file, compliance_policy_file, legal_structure_file):
    """Execute the full compliance analysis pipeline"""
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    try:
        # Stage 1: PDF Extraction
        status_text.markdown('<div class="stage-badge">Stage 1/6: PDF Extraction</div>', unsafe_allow_html=True)
        progress_bar.progress(10)
        
        # Reset file pointers
        business_plan_file.seek(0)
        compliance_policy_file.seek(0)
        legal_structure_file.seek(0)
        
        documents = extract_all_documents(
            business_plan_file,
            compliance_policy_file,
            legal_structure_file
        )
        
        # Stage 2: Preprocessing & Chunking
        status_text.markdown('<div class="stage-badge">Stage 2/6: Preprocessing & Chunking</div>', unsafe_allow_html=True)
        progress_bar.progress(25)
        
        chunks = preprocess_documents(documents)
        
        # Stage 3: Rule-based Checks
        status_text.markdown('<div class="stage-badge">Stage 3/6: Rule-based Checks & NER</div>', unsafe_allow_html=True)
        progress_bar.progress(40)
        
        rule_matches = apply_rule_checks(chunks)
        rule_coverage = get_rule_coverage(rule_matches)
        
        # Stage 4: Semantic Matching
        status_text.markdown('<div class="stage-badge">Stage 4/6: Semantic Matching</div>', unsafe_allow_html=True)
        progress_bar.progress(60)
        
        requirements = semantic_match(chunks, rule_matches, rule_coverage, client)
        
        # Stage 5: Scoring
        status_text.markdown('<div class="stage-badge">Stage 5/6: Scoring Engine</div>', unsafe_allow_html=True)
        progress_bar.progress(75)
        
        scoring_result = calculate_scores(requirements)
        urgent_gaps = identify_urgent_gaps(scoring_result["requirements"])
        
        # Stage 6: Report Generation
        status_text.markdown('<div class="stage-badge">Stage 6/6: Report Generation</div>', unsafe_allow_html=True)
        progress_bar.progress(90)
        
        urgent_recommendations = generate_ai_suggestions(urgent_gaps, client)
        general_recommendations = generate_general_recommendations(scoring_result, client)
        
        progress_bar.progress(100)
        status_text.markdown('<div class="stage-badge">✅ Analysis Complete!</div>', unsafe_allow_html=True)
        
        # Display results
        display_results(scoring_result, urgent_recommendations, general_recommendations)
        
    except Exception as e:
        st.error(f"❌ Error during analysis: {str(e)}")
        st.exception(e)


def display_results(scoring_result, urgent_recommendations, general_recommendations):
    """Display compliance analysis results"""
    
    st.markdown("---")
    st.markdown("## 📊 Compliance Analysis Results")
    
    # Overall Score
    score = scoring_result["overall_score"]
    score_class = "score-high" if score >= 70 else "score-medium" if score >= 40 else "score-low"
    
    st.markdown(f'<div class="score-display {score_class}">{score}%</div>', unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; font-size: 1.2rem; color: #666;'>Overall Compliance Readiness</p>", unsafe_allow_html=True)
    
    # Summary Stats
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("✅ Compliant", scoring_result["summary"]["compliant"])
    with col2:
        st.metric("⚠️ Partial", scoring_result["summary"]["partial"])
    with col3:
        st.metric("❌ Missing", scoring_result["summary"]["missing"])
    with col4:
        st.metric("📋 Total", scoring_result["summary"]["total"])
    
    # Tabs for detailed results
    tab1, tab2, tab3 = st.tabs(["🔴 Critical Requirements", "📋 All Requirements", "💡 Recommendations"])
    
    with tab1:
        display_critical_requirements(scoring_result["requirements"])
    
    with tab2:
        display_all_requirements(scoring_result["requirements"])
    
    with tab3:
        display_recommendations(urgent_recommendations, general_recommendations)


def display_critical_requirements(requirements):
    """Display critical requirements with detailed status"""
    critical = [r for r in requirements if r["is_critical"]]
    
    st.markdown("### Critical Requirements (2x Weight)")
    
    for req in critical:
        status_emoji = "✅" if req["status"] == "compliant" else "⚠️" if req["status"] == "partial" else "❌"
        status_color = "#10b981" if req["status"] == "compliant" else "#f59e0b" if req["status"] == "partial" else "#ef4444"
        
        with st.expander(f"{status_emoji} {req['requirement']} - **{req['status'].upper()}**"):
            st.markdown(f"**Category:** {req['category']}")
            st.markdown(f"**Similarity Score:** {req['similarity_score']:.2%}")
            st.markdown(f"**Details:** {req['details']}")
            st.markdown(f"**Found in:** {req['found_in_document'].replace('_', ' ').title()}")
            st.markdown(f"**Points:** {req['points']}/100 (Weight: {req['weight']}x)")


def display_all_requirements(requirements):
    """Display all requirements grouped by category"""
    # Group by category
    categories = {}
    for req in requirements:
        cat = req["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(req)
    
    for category, reqs in categories.items():
        st.markdown(f"### {category}")
        
        for req in reqs:
            status_emoji = "✅" if req["status"] == "compliant" else "⚠️" if req["status"] == "partial" else "❌"
            
            with st.expander(f"{status_emoji} {req['requirement']}"):
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**Status:** {req['status'].upper()}")
                    st.markdown(f"**Similarity:** {req['similarity_score']:.2%}")
                with col2:
                    st.markdown(f"**Points:** {req['points']}/100")
                    if req.get("is_critical"):
                        st.markdown("⭐ **Critical Requirement**")
                
                st.markdown(f"**Details:** {req['details']}")


def display_recommendations(urgent_recommendations, general_recommendations):
    """Display AI-generated recommendations"""
    
    if urgent_recommendations:
        st.markdown("### 🚨 Urgent Action Items")
        st.markdown("Critical gaps that require immediate attention:")
        
        for rec in urgent_recommendations:
            with st.container():
                st.markdown(f"#### {rec['requirement']}")
                st.markdown(f"**Status:** {rec['status'].upper()}")
                st.markdown(f"**Recommendation:** {rec['suggestion']}")
                
                if rec['resources']:
                    st.markdown("**Resources:**")
                    for resource in rec['resources']:
                        st.markdown(f"- [{resource['name']}]({resource.get('url', '#')}) - {resource.get('type', 'Resource')}")
                
                st.markdown("---")
    
    st.markdown("### 📝 General Recommendations")
    for i, rec in enumerate(general_recommendations, 1):
        st.markdown(f"{i}. {rec}")


if __name__ == "__main__":
    main()
