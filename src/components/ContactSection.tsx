import { useState } from 'react';
import { RevealOnScroll } from './RevealOnScroll';
import { Mail, Send, CheckCircle, Loader2 } from 'lucide-react';

export function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>(
    'idle'
  );

  // Estado para guardar o que o usuário digita
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Faz o envio real dos dados para o seu e-mail usando o FormSubmit
      const response = await fetch(
        'https://formsubmit.co/ajax/contato@elephotu.com',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            Nome: formData.nome,
            Email: formData.email,
            Assunto: formData.assunto,
            Mensagem: formData.mensagem,
            _subject: `Novo Contato Site Elephoto: ${formData.assunto}`, // Título do e-mail que vai chegar pra você
            _template: 'table', // Deixa o e-mail bonitinho em forma de tabela
          }),
        }
      );

      if (response.ok) {
        setStatus('success');
        // Limpa o formulário
        setFormData({ nome: '', email: '', assunto: '', mensagem: '' });

        // Volta ao normal após 5 segundos
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        throw new Error('Erro ao enviar');
      }
    } catch (error) {
      console.error(error);
      alert(
        'Ops! Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.'
      );
      setStatus('idle');
    }
  };

  return (
    <RevealOnScroll>
      <section
        id="contato"
        className="w-full max-w-6xl mx-auto py-16 px-6 mb-10"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-[2.5rem] border border-slate-100 p-8 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-12 md:gap-20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

          <div className="flex-1 space-y-6 relative z-10 flex flex-col justify-center">
            <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 tracking-tight">
              Fale com a gente
            </h2>
            <p className="text-gray-500 text-lg font-light leading-relaxed max-w-md">
              Tem alguma dúvida, sugestão, elogio ou crítica? Adoraríamos ouvir
              você! Preencha o formulário e retornaremos o mais breve possível.
            </p>

            <div className="flex items-center gap-5 mt-10 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 w-fit shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  E-mail Direto
                </p>
                <a
                  href="mailto:contato@elephotu.com"
                  className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  contato@elephotu.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex-[1.2] bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-50 relative z-10">
            {status === 'success' ? (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2 shadow-sm border border-green-100">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Mensagem Enviada!
                </h3>
                <p className="text-gray-500 font-light">
                  Obrigado por entrar em contato. Responderemos em breve.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 animate-in fade-in duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Assunto
                  </label>
                  <select
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm text-gray-700 cursor-pointer"
                  >
                    <option value="" className="text-gray-400">
                      Selecione um assunto...
                    </option>
                    <option value="Dúvida">Dúvida</option>
                    <option value="Sugestão">Sugestão</option>
                    <option value="Elogio">Elogio</option>
                    <option value="Crítica">Crítica</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none placeholder:text-gray-400 text-sm"
                    placeholder="Escreva sua mensagem aqui..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-[#0f172a] text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Enviando...
                    </span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </RevealOnScroll>
  );
}
