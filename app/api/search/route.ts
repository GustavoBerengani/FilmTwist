import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conexão com Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuração da Hugging Face
const HF_TOKEN = process.env.HF_TOKEN;

// TROCAMOS PARA O MODELO MAIS ESTÁVEL (Compatível com 384 dimensões)
const MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nenhuma busca informada' }, { status: 400 });
    }

    // 1. Gerar o Vetor
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: query }),
      }
    );

    // LER COMO TEXTO PRIMEIRO (Para evitar o erro "Unexpected token N")
    const responseText = await response.text();
    
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error("Erro: A API não retornou JSON.", responseText);
        return NextResponse.json({ error: `Erro na API da IA: ${responseText}` }, { status: 500 });
    }

    // Tratamento de Cold Start (IA acordando)
    if (result.error && typeof result.error === 'string' && result.error.includes("loading")) {
        return NextResponse.json({ error: 'A IA está acordando... Tente de novo em 20 segundos.' }, { status: 503 });
    }

    if (!response.ok) {
      throw new Error(`Erro na IA: ${JSON.stringify(result)}`);
    }

    // Garante que o embedding seja um array simples
    const embedding = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

    // 2. Buscar no Supabase
    const { data, error } = await supabase.rpc('buscar_filmes', {
      query_embedding: embedding, 
      match_threshold: 0.1,
      match_count: 5
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Erro no banco de dados' }, { status: 500 });
    }

    return NextResponse.json({ results: data });

  } catch (error: any) {
    console.error("Erro Geral:", error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}