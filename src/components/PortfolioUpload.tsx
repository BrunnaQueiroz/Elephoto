import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  UploadCloud,
  Globe,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';

export function PortfolioUpload() {
  const { setCurrentView } = useApp();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [publicPhotos, setPublicPhotos] = useState<any[]>([]);

  //  ARRASTAR E SOLTAR
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files);
    }
  };

  // LÓGICA DE UPLOAD (Preparada para o Supabase)
  const handleUpload = async (files: FileList) => {
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Faz o upload para um bucket chamado 'portfolio' no Supabase
        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Após o backend estar 100% configurado,salva a URL na tabela de portfólio
        console.log('Foto enviada com sucesso:', fileName);
      }

      alert('Fotos adicionadas ao seu portfólio público com sucesso!');
      // TODO: Recarregar a lista de fotos públicas aqui
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(
        'Erro ao enviar fotos. Verifique se o bucket "portfolio" existe no Supabase.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 animate-in fade-in zoom-in-95 duration-300">
      {/* HEADER */}
      <header className="px-6 py-8 flex max-w-6xl mx-auto w-full items-center justify-between">
        <button
          onClick={() => setCurrentView('photographerMenu')} // <-- Volta para o menu de escolha!
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="flex items-center gap-3 select-none">
          <Globe className="w-6 h-6 text-pink-500" />
          <span className="text-xl font-semibold text-gray-800 tracking-tight">
            Meu Portfólio
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-20 flex flex-col gap-8">
        {/* ÁREA DE UPLOAD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Adicionar ao Portfólio
          </h2>
          <p className="text-gray-500 mb-8">
            As fotos enviadas aqui ficarão visíveis para o público geral.
          </p>

          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
              dragActive
                ? 'border-pink-500 bg-pink-50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                <p className="text-lg font-medium text-gray-700">
                  Enviando sua arte...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-2">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-gray-700">
                  Arraste suas fotos ou{' '}
                  <span className="text-pink-600 underline decoration-pink-200 underline-offset-4">
                    clique para selecionar
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  JPG ou PNG (máx. 10MB por arquivo)
                </p>
              </>
            )}
          </div>
        </div>

        {/* GALERIA DO PORTFÓLIO (Preview visual) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-slate-400" />
              Sua Vitrine Pública
            </h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
              {publicPhotos.length} fotos
            </span>
          </div>

          {publicPhotos.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500">Seu portfólio ainda está vazio.</p>
              <p className="text-sm text-slate-400 mt-1">
                Faça o upload da sua primeira foto acima!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/*  map das fotos puxadas do banco  */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
