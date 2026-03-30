import { RevealOnScroll } from './RevealOnScroll';

export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Upload das Fotos',
      description:
        'O fotógrafo faz o upload das fotos em alta resolução para nossa nuvem segura.',
      colorClass: 'bg-blue-100 text-blue-700',
    },
    {
      number: '2',
      title: 'Geração do Código',
      description: 'Um código único e seguro é gerado para o álbum.',
      colorClass: 'bg-purple-100 text-purple-700',
    },
    {
      number: '3',
      title: 'Entrega Mágica',
      description:
        'O cliente acessa, visualiza, seleciona e baixa suas fotos favoritas.',
      colorClass: 'bg-pink-100 text-pink-700',
    },
  ];

  return (
    <RevealOnScroll>
      <section className="w-full max-w-6xl mx-auto py-16 px-6 mb-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-4">
            Como funciona a mágica
          </h2>
          <p className="text-gray-600 text-lg font-medium">
            Simples para você, incrível para seu cliente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-5 group"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:shadow-md ${step.colorClass}`}
              >
                {step.number}
              </div>
              <h3 className="font-semibold text-gray-900 text-xl tracking-tight">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-[16rem] mx-auto text-base">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </RevealOnScroll>
  );
}
