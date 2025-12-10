import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conexão com Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuração da Hugging Face
const HF_TOKEN = process.env.HF_TOKEN;
const MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nenhuma busca informada' }, { status: 400 });
    }

    // 1. Gerar o Vetor usando a API da Hugging Face (Em vez de rodar local)
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: query }),
      }
    );

    if (!hfResponse.ok) {
      throw new Error(`Erro na IA: ${hfResponse.statusText}`);
    }

    const embedding = await hfResponse.json();

    // 2. Buscar no Supabase (igual antes)
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

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}