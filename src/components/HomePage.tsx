import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  Shield,
  Camera,
  Zap,
  CheckCircle,
  Download,
  Key,
  Rocket,
  Eye,
  HeartHandshake,
  ChevronDown, // <-- Ícone novo importado aqui!
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pega o valor digitado e já transforma tudo em maiúsculo
    const rawValue = e.target.value.toUpperCase();
    let formattedCode = '';

    // Passa caractere por caractere fazendo a validação
    for (let i = 0; i < rawValue.length; i++) {
      const char = rawValue[i];

      if (formattedCode.length < 3) {
        // Nas 3 primeiras posições, só permite LETRAS de A a Z
        if (/[A-Z]/.test(char)) {
          formattedCode += char;
        }
      } else if (formattedCode.length < 7) {
        // Da 4ª à 7ª posição, só permite NÚMEROS de 0 a 9
        if (/[0-9]/.test(char)) {
          formattedCode += char;
        }
      }
    }

    // Atualiza a caixinha com o valor perfeito e filtrado
    setCode(formattedCode);
  };

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
    <div className="bg-white font-sans text-gray-900 flex flex-col">
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

      <div className="min-h-[100dvh] flex flex-col w-full relative">
        {/* HEADER */}
        <header className="relative z-10 px-6 py-8 flex max-w-6xl mx-auto w-full justify-center sm:justify-start">
          <div
            onClick={() => window.location.reload()}
            className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5 cursor-pointer group select-none"
            title="Recarregar página"
          >
            <img
              src="/logo.png"
              alt="Elephoto"
              className="h-16 sm:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight group-hover:text-gray-600 transition-colors text-center">
              Elephoto
            </span>
          </div>
        </header>

        {/* MAIN CONTENT (Login) */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-20 md:pb-32 -mt-16 md:-mt-28">
          <div className="relative w-full max-w-3xl mx-auto">
            <img
              src="/login.png"
              alt="Animais segurando cartão"
              className="w-full h-auto object-contain pointer-events-none select-none"
              draggable={false}
            />

            {/* Container principal de login */}
            <div className="absolute w-[60%] left-1/2 -translate-x-1/2 top-[45%] bottom-[5%] flex flex-col items-center justify-center px-2 sm:px-8">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="bg-[#0f172a] flex items-center justify-center gap-2 sm:gap-3 text-white px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl w-full"
                >
                  <Key className="w-4 h-4 sm:w-5 h-5" />
                  Acessar Minhas Fotos
                </button>
              ) : (
                // --- FORMULÁRIO ESTILO CARD ---
                <form
                  onSubmit={handleSubmit}
                  className="w-full flex flex-col gap-2 sm:gap-3 animate-in fade-in zoom-in duration-300"
                >
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    maxLength={7}
                    placeholder="Ex: ABC1234"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg text-sm sm:text-lg text-center focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-light tracking-widest font-mono uppercase"
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
                      disabled={code.length !== 7}
                      className="flex-1 bg-[#0f172a] text-white py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </main>

        {/* --- INDICADOR DE SCROLL ANIMADO --- */}
        <div className="absolute bottom-8 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div
            onClick={() =>
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
            }
            className="flex flex-col items-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer animate-bounce pointer-events-auto"
          >
            <span className="text-[10px] uppercase tracking-widest font-semibold mb-1">
              Descubra mais
            </span>
            <ChevronDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QUEM SOMOS E PILARES */}
      <section className="w-full max-w-6xl mx-auto py-16 px-6 mb-10 mt-10">
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="flex-1 space-y-6 text-left animate-in slide-in-from-left duration-700">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              Quem Somos
            </h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed font-light">
              <p>
                A Elephoto nasce do encontro entre o instante vivido e o olhar
                sensível de quem sabe transformá-lo em memória.
              </p>
              <p>
                Conectamos você aos seus momentos felizes e a fotógrafos que os
                eternizam com arte, técnica e originalidade, de forma simples,
                segura e acessível.
              </p>
              <p>
                E aos fotógrafos, abrimos caminhos: oferecemos oportunidades,
                estrutura e organização, para que possam dedicar-se ao que
                realmente importa: registrar histórias que merecem ser
                lembradas.
              </p>
            </div>
          </div>
          {/* SEGUNDA OPÇÃO */}
          {/* <div className="flex-1 space-y-6 text-left animate-in slide-in-from-left duration-700">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              Quem Somos
            </h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed font-light">
              <p>
                A Elephoto conecta você aos seus momentos felizes e aos
                fotógrafos capazes de eternizá-los com talento, sensibilidade e
                excelência técnica. Transformamos instantes em memórias
                memoráveis com simplicidade, segurança e acessibilidade.
              </p>
              <p>
                Para os fotógrafos, criamos um ambiente de oportunidades e bons
                encontros, permitindo que concentrem sua energia na arte de
                registrar, enquanto assumimos a estrutura, a gestão e a
                organização do processo.
              </p>
            </div>
          </div> */}

          {/* Imagem (Direita) */}
          <div className="flex-1 w-full animate-in slide-in-from-right duration-700 delay-150">
            <img
              src="/quemsomos.png"
              alt="Elefante e ovelhinhas vendo álbum de fotos mágicas"
              className="w-full h-auto object-cover rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            />
          </div>
        </div>
        {/* PARA FOTÓGRAFOS */}
        <section className="w-full max-w-6xl mx-auto px-6 mb-20">
          <RevealOnScroll>
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-[2.5rem] border border-slate-100 p-8 md:p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-6">
                  É fotógrafo(a)? Junte-se à Elephoto
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed font-light max-w-2xl mx-auto mb-10">
                  Simplifique a entrega dos seus trabalhos criando galerias
                  seguras com código para seus clientes e atraia novos olhares
                  montando o seu próprio portfólio público. Tudo em um só lugar.
                </p>

                <button
                  onClick={() => setCurrentView('admin')}
                  className="inline-flex items-center justify-center gap-3 bg-[#0f172a] hover:bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <Camera className="w-6 h-6" />
                  Conhecer Área do Fotógrafo
                </button>
              </div>
            </div>
          </RevealOnScroll>
        </section>
        <RevealOnScroll>
          <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-16 mb-10 relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight text-center mb-14">
              Nossos Pilares
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {/* Missão */}
              <div className="flex flex-col items-center space-y-4 group animate-in fade-in zoom-in duration-500 delay-100">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-xl tracking-tight">
                  Missão
                </h3>
                <p className="text-gray-500 leading-relaxed max-w-[16rem] mx-auto font-light">
                  Facilitar o acesso a memórias fotográficas de alta qualidade
                  de forma rápida, encantadora e segura.
                </p>
              </div>

              {/* Visão */}
              <div className="flex flex-col items-center space-y-4 group animate-in fade-in zoom-in duration-500 delay-200">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-xl tracking-tight">
                  Visão
                </h3>
                <p className="text-gray-500 leading-relaxed max-w-[16rem] mx-auto font-light">
                  Ser a plataforma referência em entrega de fotografia digital,
                  conectando corações às suas melhores lembranças.
                </p>
              </div>

              {/* Valores */}
              <div className="flex flex-col items-center space-y-4 group animate-in fade-in zoom-in duration-500 delay-300">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-xl tracking-tight">
                  Valores
                </h3>
                <ul className="text-gray-500 leading-relaxed max-w-[16rem] mx-auto font-light list-none space-y-1">
                  <li>Segurança e Privacidade</li>
                  <li>Qualidade Impecável</li>
                  <li>Encantamento do Cliente</li>
                </ul>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* BLOCO DE MARKETING */}
      <RevealOnScroll>
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-4 duration-700 bg-slate-50 py-16 px-6 sm:px-12 rounded-3xl border border-slate-100 shadow-sm mb-20">
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
        </div>
      </RevealOnScroll>

      {/* FEATURES SECTION (Rodapé Cinza Claro) */}
      <RevealOnScroll>
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
                Receba suas fotografias em alta resolução, prontas para
                impressão e redes sociais.
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
                Pague via Pix ou cartão de crédito de forma rápida, transparente
                e segura.
              </p>
            </div>
          </div>

          <div className="text-center mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-400 text-xs">
              © 2026 Elephoto. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
