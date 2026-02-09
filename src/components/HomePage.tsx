import { useState, useEffect } from 'react';
import { Search, Camera, CheckCircle, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export function HomePage() {
  const { setCurrentView, cart, clearCart } = useApp();
  const [code, setCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Verifica se voltou do Stripe com sucesso
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success') === 'true') {
      setShowSuccessModal(true);
      // Limpa a URL para não ficar aquele monte de código feio
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      localStorage.setItem('elephoto_code', code.toUpperCase());
      setCurrentView('gallery');
    }
  };

  // Função para baixar as fotos originais após pagamento
  const handleDownloadOriginals = async () => {
    for (const photo of cart) {
      if (photo.filename) {
        try {
          const { data } = await supabase.storage
            .from('photos')
            .download(photo.filename);

          if (data) {
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `original_${photo.id.slice(0, 5)}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error('Erro ao baixar', err);
        }
      }
    }
    // Limpa o carrinho e fecha o modal
    clearCart();
    setShowSuccessModal(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* MODAL DE SUCESSO PÓS-PAGAMENTO */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h2>
            <p className="text-gray-600 mb-6">
              Obrigado pela compra. Suas fotos em alta resolução estão prontas.
            </p>
            <button
              onClick={handleDownloadOriginals}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Baixar Todas as Fotos
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-6 h-6 text-gray-900" />
          <span className="text-xl font-semibold tracking-tight">Elephoto</span>
        </div>
        <button
          onClick={() => setCurrentView('admin')}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sou fotógrafo(a)
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900">
              Suas fotos,
              <br />
              entregues com estilo.
            </h1>
            <p className="text-gray-500 text-lg">
              Digite o código fornecido pelo seu fotógrafo para acessar seu
              álbum exclusivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl text-lg outline-none focus:bg-white focus:border-gray-900 transition-all placeholder:text-gray-400"
              placeholder="Digite seu código aqui..."
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-400 text-sm">
        © 2024 Elephoto. Todos os direitos reservados.
      </footer>
    </div>
  );
}
