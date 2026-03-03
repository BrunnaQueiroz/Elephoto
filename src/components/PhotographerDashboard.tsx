import { Lock, Globe, ImagePlus } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // Descomente para usar o roteamento do Next

export function PhotographerDashboard() {
  // const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            O que vamos enviar hoje?
          </h1>
          <p className="text-zinc-500 text-lg">
            Selecione o destino das fotos que você deseja fazer o upload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Fotos Privadas */}
          <button
            // onClick={() => router.push('/upload/privado')}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                Fotos do Cliente
              </h2>
              <p className="text-zinc-500 leading-relaxed">
                Álbum privado e seguro. Você precisará inserir o código do
                cliente antes de enviar os arquivos.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold">
              <ImagePlus className="w-5 h-5 mr-2" />
              Enviar fotos privadas
            </div>
          </button>

          {/* Card: Fotos Públicas */}
          <button
            // onClick={() => router.push('/upload/publico')}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                Fotos Públicas
              </h2>
              <p className="text-zinc-500 leading-relaxed">
                Fotos de paisagens e extras que ficarão disponíveis para todos
                os clientes comprarem no carrinho.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-emerald-600 font-semibold">
              <ImagePlus className="w-5 h-5 mr-2" />
              Enviar fotos públicas
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
