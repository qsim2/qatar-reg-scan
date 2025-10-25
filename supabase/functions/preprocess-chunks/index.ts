import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Chunk {
  id: string;
  text: string;
  start_char: number;
  end_char: number;
  document_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { raw_text, document_type } = await req.json();
    
    console.log(`Preprocessing and chunking text (${raw_text.length} chars)`);
    
    // Clean text
    const cleanedText = raw_text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
    
    // Chunk text (500 char chunks with 100 char overlap)
    const chunkSize = 500;
    const overlap = 100;
    const chunks: Chunk[] = [];
    
    let startPos = 0;
    let chunkId = 0;
    
    while (startPos < cleanedText.length) {
      const endPos = Math.min(startPos + chunkSize, cleanedText.length);
      const chunkText = cleanedText.substring(startPos, endPos);
      
      chunks.push({
        id: `${document_type}_chunk_${chunkId}`,
        text: chunkText,
        start_char: startPos,
        end_char: endPos,
        document_type,
      });
      
      startPos += chunkSize - overlap;
      chunkId++;
    }
    
    console.log(`Created ${chunks.length} chunks`);
    
    return new Response(
      JSON.stringify({
        document_type,
        chunks,
        total_chunks: chunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Preprocessing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
