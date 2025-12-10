import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conexão com Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuração da Hugging Face
const HF_TOKEN = process.env.HF_TOKEN;

// Voltamos para o seu modelo original (Multilíngue) que é o melhor
const MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nenhuma busca informada' }, { status: 400 });
    }

    // 1. Gerar o Vetor
    // AQUI ESTÁ O SEGREDO: Usamos 'api-inference' + '/models/' (Essa rota funciona!)
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

    // LER A RESPOSTA
    const responseText = await response.text();
    let result;
    
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error("Erro API não é JSON:", responseText);
        return NextResponse.json({ error: `Erro na API da IA: ${responseText}` }, { status: 500 });
    }

    // 2. TRATAMENTO DE ERROS ESPECÍFICOS DA HUGGING FACE
    
    // Erro de Cold Start (IA dormindo)
    if (result.error && typeof result.error === 'string' && result.error.includes("loading")) {
        // Retornamos 503 para o Frontend saber que é só esperar
        return NextResponse.json({ error: 'A IA está acordando... Aguarde 20s e tente de novo.' }, { status: 503 });
    }

    // Outros erros
    if (!response.ok) {
        console.error("Erro HF:", result);
        throw new Error(`Erro na IA: ${JSON.stringify(result)}`);
    }

    // 3. EXTRAÇÃO DO VETOR
    // A API pode retornar: [0.1, 0.2...] OU [[0.1, 0.2...]] (Vetor dentro de lista)
    let embedding;
    if (Array.isArray(result)) {
        // Se o primeiro item também for um array, pegamos ele (caso de lote)
        if (Array.isArray(result[0])) {
            embedding = result[0];
        } else {
            // Se for lista de números direto
            embedding = result;
        }
    } else {
        // Se vier objeto estranho
        throw new Error("Formato de resposta inesperado da IA");
    }

    // 4. Buscar no Supabase
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