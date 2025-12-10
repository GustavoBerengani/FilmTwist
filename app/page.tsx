'use client'
import { useState } from 'react'

export default function Home() {
  const [query, setQuery] = useState('')
  const [filmes, setFilmes] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!query) return;
    setLoading(true);
    setFilmes([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      if (data.results) {
        setFilmes(data.results);
      }
    } catch (error) {
      console.error("Erro na busca", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 text-blue-400">FilmTwist 🎬</h1>
        <p className="mb-8 text-gray-400">Busque filmes pelo sentimento, enredo ou descrição.</p>

        <div className="flex gap-2 mb-8">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: Um filme triste sobre espaço e solidão..."
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-white"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Pensando...' : 'Buscar'}
          </button>
        </div>

        <div className="space-y-4">
          {filmes.map((filme: any) => (
            <div key={filme.id} className="flex gap-4 bg-gray-800 p-4 rounded-xl hover:bg-gray-750 transition-colors">
              <img 
                src={filme.url_imagem} 
                alt={filme.titulo} 
                className="w-24 h-36 object-cover rounded-md"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{filme.titulo}</h2>
                <div className="text-xs font-mono text-green-400 mb-2">
                  Match: {(filme.similarity * 100).toFixed(1)}%
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{filme.sinopse}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filmes.length === 0 && !loading && (
          <p className="text-center text-gray-600 mt-10">Os resultados aparecerão aqui.</p>
        )}
      </div>
    </main>
  )
}