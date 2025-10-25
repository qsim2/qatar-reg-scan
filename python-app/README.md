# QCB Regulatory Navigator & Readiness Evaluator

A hackathon MVP for evaluating FinTech startup compliance with Qatar Central Bank regulations.

## Features

- **3 PDF Uploads**: Business Plan, Compliance Policy, Legal Structure
- **AI-Powered Analysis**: Two-stage evaluation with GPT-4o-mini
- **4 PDF Outputs**: 3 annotated original documents + 1 comprehensive summary report
- **Resource Mapping**: Links compliance gaps to local support programs

## Local Setup Instructions

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)
- OpenAI API key

### Step 1: Install Dependencies

Open a terminal/command prompt in the `python-app` directory and run:

```bash
pip install -r requirements.txt
```

### Step 2: Configure OpenAI API Key

Edit the `.streamlit/secrets.toml` file and replace `your-openai-api-key-here` with your actual OpenAI API key:

```toml
OPENAI_API_KEY = "sk-proj-..."
```

**Alternative**: Set as environment variable:
```bash
export OPENAI_API_KEY="sk-proj-..."  # On macOS/Linux
set OPENAI_API_KEY="sk-proj-..."     # On Windows
```

### Step 3: Run the Application

```bash
streamlit run app.py
```

The application will open automatically in your default web browser at `http://localhost:8501`

## Usage

1. **Upload PDFs**: Click the three file upload buttons and select your documents
2. **Evaluate**: Click "🚀 Evaluate Compliance" to start the analysis
3. **Download Reports**: After processing (30-60 seconds), download all 4 generated PDFs

## Sample Test Documents

For testing, you can create PDFs from the sample content provided in the original requirements:

- **Business Plan**: Use "Project Al-Ameen" content
- **Compliance Policy**: Use "Al-Ameen Digital - Internal Compliance Policy" content
- **Legal Structure**: Use "Al-Ameen Digital, LLC: Articles of Association" content

## Architecture

- **Frontend**: Streamlit (Python web framework)
- **PDF Processing**: PyMuPDF (text extraction + annotations)
- **PDF Generation**: ReportLab (summary report)
- **AI Analysis**: OpenAI GPT-4o-mini (two-stage evaluation + suggestions)

## File Structure

```
python-app/
├── app.py                          # Main application
├── requirements.json               # QCB compliance rules
├── resource_mapping_data.json      # Support resources
├── requirements.txt                # Python dependencies
├── .streamlit/
│   └── secrets.toml               # API keys (not committed)
└── README.md                      # This file
```

## Troubleshooting

**Issue**: `ModuleNotFoundError: No module named 'streamlit'`
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: `openai.AuthenticationError`
- **Solution**: Check your OpenAI API key in `.streamlit/secrets.toml`

**Issue**: PDF annotations not visible
- **Solution**: Open annotated PDFs in Adobe Acrobat Reader (some PDF viewers don't show annotations)

**Issue**: "Rate limit exceeded" error
- **Solution**: Wait a few minutes or upgrade your OpenAI API plan

## Cost Estimate

Using GPT-4o-mini:
- ~12-15 API calls per evaluation (1 evaluation + 5-10 suggestions)
- Estimated cost: $0.02-0.05 per complete analysis

## Limitations (MVP Scope)

- PDF annotations are placed on the page where the quote is found, but precise positioning is approximate
- Only first 50 characters of key quotes are used for search (to handle partial matches)
- No user authentication or session management
- Processing time: 30-60 seconds for full analysis

## Next Steps for Production

1. Add user authentication
2. Store analysis results in database
3. Implement more sophisticated PDF positioning algorithms
4. Add support for multi-language documents
5. Create admin dashboard for requirements management
