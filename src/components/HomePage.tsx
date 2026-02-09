import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Shield, Camera, Zap, UserCog } from 'lucide-react'; // Ícones para as novas seções

export function HomePage() {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentCode, setCurrentView } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('cards')
        .select('code')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Código inválido. Tente novamente.');
        setLoading(false);
        return;
      }

      setCurrentCode(code.trim().toUpperCase());
      setCurrentView('gallery');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Erro ao verificar código. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-light">
      {/* --- HEADER --- */}
      <header className="border-b border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Elephoto Logo"
            className="h-10 w-auto object-contain"
          />
          <span className="text-xl text-gray-800 tracking-wide font-normal">
            Elephoto
          </span>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL (HERO) --- */}
      <main className="flex-grow">
        <section className="py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">
              Acesse suas fotografias com <br />
              <span className="font-medium">segurança e praticidade</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Suas fotos profissionais em um só lugar. Selecione, compre e
              receba suas imagens de forma simples e segura.
            </p>

            {/* ÁREA DO FORMULÁRIO/BOTÃO CENTRALIZADA */}
            <div className="max-w-md mx-auto">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full bg-gray-900 text-white py-4 px-8 rounded-lg text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Acessar Minhas Fotos
                </button>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Digite o código do cartão"
                      className="w-full px-6 py-4 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-gray-50"
                      autoFocus
                      disabled={loading}
                    />

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInput(false);
                          setCode('');
                          setError('');
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70"
                        disabled={loading || !code.trim()}
                      >
                        {loading ? 'Verificando...' : 'Entrar'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              {/* --- LINK DO FOTÓGRAFO (NOVO) --- */}
              <div className="mt-6">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="text-gray-400 text-sm hover:text-gray-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <UserCog className="w-4 h-4" />
                  Sou fotógrafo(a)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE CARACTERÍSTICAS (FEATURES) --- */}
        <section className="bg-gray-50 py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-700">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Acesso Privado
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Suas fotos são exclusivas e acessíveis apenas com seu código
                pessoal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-700">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Alta Qualidade
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receba suas fotografias em alta resolução, prontas para
                impressão e redes sociais.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-700">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Pagamento Fácil
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Pague via Pix ou cartão de crédito de forma rápida, transparente
                e segura.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Elephoto. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
