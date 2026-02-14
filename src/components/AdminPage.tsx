import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  Upload,
  Plus,
  LogOut,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

export function AdminPage() {
  const { setCurrentView } = useApp();

  // Estados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newToken, setNewToken] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const setError = (msg: string | null) => {
    if (msg) setStatus({ type: 'error', msg });
    else setStatus(null);
  };

  // --- LOGIN MOCK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Credenciais inválidas. Tente admin / admin');
    }
  };

  // --- FUNÇÃO DE MARCA D'ÁGUA ---
  // Aceita File ou Blob (pois a compressão retorna um File/Blob)
  const applyWatermark = (file: File | Blob): Promise<Blob> => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.floor(img.width * 0.15);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-45 * Math.PI) / 180);

        ctx.fillText('ELEPHOTO', 0, 0);

        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
          },
          'image/jpeg',
          0.85
        );
      };
    });
  };

  // --- UPLOAD COM VALIDAÇÃO E COMPRESSÃO ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Limpeza básica
    const token = newToken.trim().toUpperCase();

    // 2. --- NOVA VALIDAÇÃO ANTI-ERRO ---
    const regex = /^[A-Z0-9]+$/;

    if (!token) return;

    if (!regex.test(token)) {
      setStatus({
        type: 'error',
        msg: '⚠️ O código não pode ter acentos, espaços ou símbolos. Use apenas letras e números (Ex: NOIVOS2026).',
      });
      return;
    }

    if (!files || files.length === 0) return;

    setLoading(true);
    setStatus(null);

    try {
      // Cria Token no Banco
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .insert([{ code: token }])
        .select()
        .single();

      if (cardError) {
        if (cardError.code === '23505')
          throw new Error('Este código já existe! Tente outro.');
        throw cardError;
      }

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = Date.now();

        // ----------------------------------------------------
        // PASSO A: COMPRESSÃO DA IMAGEM PARA A VITRINE
        // ----------------------------------------------------
        const compressionOptions = {
          maxSizeMB: 0.3, // Máximo de 300KB
          maxWidthOrHeight: 1080, // Tamanho ideal para web/celular
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, compressionOptions);

        // ----------------------------------------------------
        // PASSO B: MARCA D'ÁGUA NA IMAGEM JÁ COMPRIMIDA
        // ----------------------------------------------------
        const watermarkedBlob = await applyWatermark(compressedFile);
        const watermarkedFile = new File(
          [watermarkedBlob],
          `wm_${safeFileName}`,
          { type: 'image/jpeg' }
        );

        const fileNameOriginal = `${token}/original_${timestamp}_${i}_${safeFileName}`;
        const fileNamePublic = `${token}/display_${timestamp}_${i}.jpg`;

        // Upload Original (A foto pesada de 10MB sem marca d'água)
        await supabase.storage.from('photos').upload(fileNameOriginal, file);

        // Upload Vitrine (A foto leve de 300KB com marca d'água)
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileNamePublic, watermarkedFile);

        if (uploadError) throw uploadError;

        // Pegar as duas URLs
        const {
          data: { publicUrl: thumbUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNamePublic);
        const {
          data: { publicUrl: origUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNameOriginal);

        uploadedPhotos.push({
          card_id: cardData.id,
          url: origUrl, // A foto original pesada para download pós-compra
          thumbnail_url: thumbUrl, // A foto leve e protegida para a galeria
          price: 15.0,
          filename: fileNameOriginal,
        });
      }

      const { error: photosError } = await supabase
        .from('photos')
        .insert(uploadedPhotos);

      if (photosError) throw photosError;

      setStatus({
        type: 'success',
        msg: `Sucesso! Token ${token} criado com ${files.length} fotos.`,
      });
      setNewToken('');
      setFiles(null);

      const fileInput = document.getElementById(
        'file-upload'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        msg: err.message || 'Erro ao realizar upload.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-900">
              Área do Fotógrafo
            </h2>
            <p className="text-sm text-gray-500 mt-2">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
                placeholder="admin"
              />
            </div>

            {status?.type === 'error' && (
              <p className="text-red-500 text-sm text-center">{status.msg}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="w-full text-gray-500 text-sm hover:text-gray-700 mt-2"
            >
              Voltar para Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Elephoto Admin</span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            BETA
          </span>
        </div>
        <button
          onClick={() => setCurrentView('home')}
          className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6" /> Novo Álbum
          </h2>

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Código do Cliente
              </label>
              <input
                type="text"
                value={newToken}
                onChange={e => setNewToken(e.target.value.toUpperCase())}
                placeholder="EX: CASAMENTO01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none uppercase font-semibold"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use apenas letras e números (sem acentos).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Selecione as Fotos
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*"
                  onChange={e => setFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="flex flex-col items-center pointer-events-none">
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">
                    {files && files.length > 0
                      ? `${files.length} arquivos selecionados`
                      : 'Clique ou arraste as fotos aqui'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {status && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newToken || !files}
              className="w-full bg-gray-900 text-white py-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processando
                  Imagens...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Criar Álbum
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
