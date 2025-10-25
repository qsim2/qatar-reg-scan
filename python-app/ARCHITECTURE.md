# QCB Compliance Navigator - Architecture

## System Architecture

This application follows a **6-stage pipeline architecture** for intelligent compliance analysis:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User      │────>│   Frontend   │────>│  PDF Extraction │
│ (Browser)   │     │  (Streamlit) │     │    (Stage 1)    │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                   │
                                                   v
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Preprocessing & │<────│  Rule-based      │<────│   Semantic      │
│   Chunking      │     │  Checks & NER    │     │   Matching      │
│   (Stage 2)     │     │   (Stage 3)      │     │   (Stage 4)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         v
┌─────────────────┐     ┌──────────────────┐
│  Scoring        │────>│  Report          │
│  Engine         │     │  Generation      │
│  (Stage 5)      │     │  (Stage 6)       │
└─────────────────┘     └──────────────────┘
```

## Pipeline Stages

### Stage 1: PDF Extraction (`pdf_extractor.py`)
- **Input**: 3 PDF files (Business Plan, Compliance Policy, Legal Structure)
- **Process**: Extracts raw text from PDFs using PyMuPDF
- **Output**: Dictionary of document texts

### Stage 2: Preprocessing & Chunking (`preprocessor.py`)
- **Input**: Raw document texts
- **Process**: 
  - Text cleaning and normalization
  - Creates overlapping chunks (500 chars, 100 char overlap)
  - Adds metadata (document type, position)
- **Output**: List of text chunks with metadata

### Stage 3: Rule-based Checks & NER (`rule_checker.py`)
- **Input**: Text chunks
- **Process**:
  - Applies regex patterns for Named Entity Recognition
  - Detects: Capital amounts, Data residency mentions, AML/KYC keywords, Personnel, Licensing types
  - Maps matches to requirement IDs
- **Output**: List of rule matches with coverage statistics

### Stage 4: Semantic Matching (`semantic_matcher.py`)
- **Input**: Text chunks, Rule matches
- **Process**:
  - Generates embeddings using OpenAI `text-embedding-3-small`
  - Calculates cosine similarity between requirements and chunks
  - Determines compliance status using similarity + rule coverage
- **Output**: List of requirements with status (compliant/partial/missing)

### Stage 5: Scoring Engine (`scoring_engine.py`)
- **Input**: Evaluated requirements
- **Process**:
  - Applies weighted scoring (critical requirements = 2x weight)
  - Calculates overall percentage score
  - Identifies urgent gaps
- **Output**: Scoring result with weighted breakdown

### Stage 6: Report Generation (`report_generator.py`)
- **Input**: Scoring results, Urgent gaps
- **Process**:
  - Generates AI-powered recommendations using GPT-4
  - Maps requirements to external resources
  - Creates strategic recommendations
- **Output**: Comprehensive compliance report

## Critical Requirements (2x Weight)

The following requirements are weighted 2x in the scoring algorithm:
- `minimum_capital_psp` - QAR 5,000,000 for PSP
- `minimum_capital_p2p` - QAR 7,500,000 for P2P Lending
- `minimum_capital_wealth` - QAR 4,000,000 for Wealth Management
- `data_residency` - Data must be stored in Qatar
- `primary_data_environment` - Primary data environment compliance
- `aml_policy` - Board-approved AML/CFT policy

## Status Determination Logic

**Compliant:**
- Semantic similarity > 0.7, OR
- Similarity > 0.5 AND has rule-based matches

**Partial:**
- Semantic similarity between 0.4 and 0.7

**Missing:**
- Semantic similarity < 0.4

## Data Flow

1. **User uploads PDFs** → Frontend (Streamlit)
2. **PDFs → Text** → `pdf_extractor.py`
3. **Text → Chunks** → `preprocessor.py`
4. **Chunks → Rule Matches** → `rule_checker.py`
5. **Chunks + Rules → Requirements** → `semantic_matcher.py` (uses OpenAI embeddings)
6. **Requirements → Scores** → `scoring_engine.py`
7. **Scores → Report** → `report_generator.py` (uses GPT-4 for suggestions)
8. **Report → Display** → Frontend (Streamlit)

## Key Technologies

- **Frontend**: Streamlit
- **PDF Processing**: PyMuPDF (fitz)
- **NLP**: OpenAI Embeddings API (`text-embedding-3-small`)
- **AI Recommendations**: OpenAI GPT-4 (`gpt-4o-mini`)
- **Vector Operations**: NumPy (cosine similarity)
- **Pattern Matching**: Python regex (re module)

## Configuration Files

- `requirements.json` - QCB requirement definitions
- `resource_mapping_data.json` - External resource mappings
- `.streamlit/secrets.toml` - OpenAI API key storage

## Advantages of This Architecture

1. **Modularity**: Each stage is independent and testable
2. **Hybrid Approach**: Combines rule-based and semantic matching
3. **Explainability**: Clear scoring logic with weighted requirements
4. **Scalability**: Easy to add new requirements or rules
5. **Accuracy**: Dual validation (rules + embeddings) reduces false positives

## Performance Considerations

- **Embedding calls**: ~3-5 seconds for all requirements + chunks
- **Rule matching**: < 1 second (regex-based)
- **AI suggestions**: ~2-3 seconds per urgent gap
- **Total analysis time**: ~10-20 seconds for typical document set

## Future Enhancements

- [ ] Cache embeddings for repeated analyses
- [ ] Add visualization of semantic matches
- [ ] Implement PDF annotation with highlighted issues
- [ ] Add batch processing for multiple companies
- [ ] Create API endpoint for programmatic access
