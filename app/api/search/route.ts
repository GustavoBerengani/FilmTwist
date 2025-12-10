import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

// Configuração do Supabase (Substitua pelas suas chaves REAIS aqui ou use variaveis de ambiente)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nenhuma busca informada' }, { status: 400 });
    }

    // 1. Carregar a IA e gerar o vetor da pergunta
    // Na primeira vez, ele vai baixar o modelo (igual aconteceu no Python)
 const generateEmbedding = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    
    const output = await generateEmbedding(query, {
      pooling: 'mean',
      normalize: true,
    });

    // Converter para array simples de números
    const embedding = Array.from(output.data);

    // 2. Buscar no Supabase usando a função RPC que criamos no SQL
    const { data, error } = await supabase.rpc('buscar_filmes', {
      query_embedding: embedding, // O vetor da pergunta
      match_threshold: 0.1,       // Nível de similaridade mínima
      match_count: 5              // Quantos filmes retornar
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