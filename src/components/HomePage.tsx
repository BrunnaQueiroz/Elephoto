import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Shield, Camera, Zap, CheckCircle, Download, Key } from 'lucide-react';

export function HomePage() {
  const { setCurrentView, cart, clearCart } = useApp();

  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- LÓGICA DE SUCESSO DO PAGAMENTO ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success') === 'true') {
      setShowSuccessModal(true);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

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
    clearCart();
    setShowSuccessModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clearCart(); // <-- ZERA QUALQUER LIXO ANTERIOR AQUI
    localStorage.setItem('elephoto_code', code);
    setCurrentView('gallery');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      {/* MODAL DE SUCESSO */}
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
              <Download className="w-5 h-5" /> Baixar Fotos Originais
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}

      <header className="px-6 py-8 flex justify-center items-center max-w-6xl mx-auto w-full">
        {/* LOGO INTERATIVO */}
        <div
          onClick={() => window.location.reload()}
          className=" flex items-center gap-3 cursor-pointer group select-none"
          title="Recarregar página"
        >
          <img
            src="/logo.png"
            alt="Elephoto"
            className=" h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
          />
          {/* <span className="text-2xl font-medium text-gray-800 tracking-tight group-hover:text-gray-600 transition-colors">
            Elephoto
          </span> */}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-start pt-12 px-4 text-center pb-20">
        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-light text-gray-900 tracking-tight leading-tight">
            Acesse suas fotografias com <br />
            <span className="font-semibold block mt-2">
              segurança e praticidade
            </span>
          </h1>

          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Suas fotos profissionais em um só lugar. Selecione, compre e receba
            suas imagens de forma simples e segura.
          </p>

          {/* Container principal de login */}
          <div className="relative w-full max-w-3xl mx-auto">
            <img
              src="/login.png"
              alt="Animais segurando cartão"
              className="w-full h-auto object-contain pointer-events-none select-none"
              draggable={false}
            />

            {/* A MÁGICA AQUI: w-[72%] acompanha a largura do desenho. left-1/2 e -translate-x-1/2 cravam no centro. */}
            <div className="absolute w-[60%] left-1/2 -translate-x-1/2 top-[45%] bottom-[5%] flex flex-col items-center justify-center px-2 sm:px-8">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  // Removi o max-w-xs e reduzi py-3 para py-2 em telas pequenas
                  className="bg-[#0f172a] flex items-center justify-center gap-2 sm:gap-3 text-white px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl w-full"
                >
                  <Key className="w-4 h-4 sm:w-5 h-5" />
                  Acessar Minhas Fotos
                </button>
              ) : (
                // --- FORMULÁRIO ESTILO CARD ---
                <form
                  onSubmit={handleSubmit}
                  // Removi o max-w-xs
                  className="w-full flex flex-col gap-2 sm:gap-3 animate-in fade-in zoom-in duration-300"
                >
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Código elephotopass"
                    // Textos e espaçamentos menores no celular (text-sm, py-2) e maiores no PC (sm:text-lg, sm:py-3)
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg text- sm:text-lg text-center focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-light"
                    autoFocus
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInput(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#0f172a] text-white py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              )}

              {/* LINK DE FOTÓGRAFO */}
              <button
                onClick={() => setCurrentView('admin')}
                className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm transition-colors mt-2 sm:mt-4 underline decoration-transparent hover:decoration-gray-400 underline-offset-4"
              >
                Sou fotógrafo(a)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FEATURES SECTION (Rodapé Cinza Claro) */}
      <div className="bg-gray-50 border-t border-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-700">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Acesso Privado
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Suas fotos são exclusivas e acessíveis apenas com seu código
              pessoal.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-700">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Alta Qualidade
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Receba suas fotografias em alta resolução, prontas para impressão
              e redes sociais.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-700">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Pagamento Fácil
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Pague via Pix ou cartão de crédito de forma rápida, transparente e
              segura.
            </p>
          </div>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-400 text-xs">
            © 2026 Elephoto. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
