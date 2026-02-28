import { useApp } from '../context/AppContext';
import { Lock, Globe, ArrowLeft, Camera } from 'lucide-react';

export function PhotographerMenu() {
  const { setCurrentView } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 animate-in fade-in duration-500">
      {/* HEADER SIMPLES COM BOTÃO DE VOLTAR */}
      <header className="px-6 py-8 flex max-w-6xl mx-auto w-full items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Home
        </button>
        <div className="flex items-center gap-3 select-none">
          <Camera className="w-6 h-6 text-[#0f172a]" />
          <span className="text-xl font-semibold text-gray-800 tracking-tight">
            Área do Fotógrafo
          </span>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-4xl w-full text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
            O que você deseja fazer hoje?
          </h1>
          <p className="text-gray-500 text-lg">
            Escolha como você quer entregar ou expor o seu trabalho.
          </p>
        </div>

        {/* GRID DOS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* CARD 1: ENTREGA PRIVADA (Leva para o admin atual) */}
          <button
            onClick={() => setCurrentView('admin')}
            className="group relative flex flex-col text-left bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Entrega Privada
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Crie galerias seguras com código de acesso único (Ex: ABC1234)
              para seus clientes visualizarem e comprarem fotos de ensaios ou
              eventos.
            </p>
          </button>

          {/* CARD 2: PORTFÓLIO PÚBLICO (Nova funcionalidade futura) */}
          <button
            onClick={() => setCurrentView('portfolioUpload')}
            className="group relative flex flex-col text-left bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute top-0 right-0 m-6 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Novo
            </div>
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Meu Portfólio
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Suba suas melhores fotos para uma galeria pública com a sua cara e
              atraia novos clientes exibindo a qualidade do seu olhar.
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
