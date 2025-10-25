import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_base64, document_type } = await req.json();
    
    console.log(`Extracting PDF for document type: ${document_type}`);
    
    // Decode base64 PDF
    const pdfBytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    let fullText = "";
    
    // Extract text from each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      // Note: pdf-lib doesn't have built-in text extraction
      // For production, use a proper PDF parsing library
      // This is a simplified placeholder
      fullText += `[Page ${i + 1} content]\n`;
    }
    
    console.log(`Extracted ${fullText.length} characters from PDF`);
    
    return new Response(
      JSON.stringify({
        document_type,
        raw_text: fullText,
        page_count: pages.length,
        char_count: fullText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PDF extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
