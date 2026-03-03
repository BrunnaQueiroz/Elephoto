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
  Lock,
  Globe,
  ImagePlus,
  ArrowLeft,
} from 'lucide-react';

export function AdminPage() {
  const { setCurrentView } = useApp();

  // Estados de Autenticação e Navegação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uploadMode, setUploadMode] = useState<
    'selection' | 'private' | 'public'
  >('selection');

  // Estados do Formulário de Upload
  const [newToken, setNewToken] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase();
    let formattedCode = '';

    for (let i = 0; i < rawValue.length; i++) {
      const char = rawValue[i];
      if (formattedCode.length < 3) {
        if (/[A-Z]/.test(char)) formattedCode += char;
      } else if (formattedCode.length < 7) {
        if (/[0-9]/.test(char)) formattedCode += char;
      }
    }
    setNewToken(formattedCode);
  };

  const setError = (msg: string | null) => {
    if (msg) setStatus({ type: 'error', msg });
    else setStatus(null);
  };

  // --- LOGIN MOCK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === 'Eleph@to2026') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Credenciais inválidas. ');
    }
  };

  // --- FUNÇÃO DE MARCA D'ÁGUA ---
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

    const token = newToken.trim().toUpperCase();

    // Se for modo privado, exige validação do código
    if (uploadMode === 'private') {
      const regex = /^[A-Z]{3}[0-9]{4}$/;
      if (!regex.test(token)) {
        setStatus({
          type: 'error',
          msg: '⚠️ O código deve ter exatamente 3 letras seguidas de 4 números (Ex: ABC1234).',
        });
        return;
      }
    }

    if (!files || files.length === 0) return;

    setLoading(true);
    setStatus(null);

    try {
      let cardId = null;
      let folderName = 'public_gallery'; // Pasta padrão para fotos públicas

      // Se for privado, cria ou recupera o Card no banco
      if (uploadMode === 'private') {
        folderName = token; // Pasta com o nome do código
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .insert([{ code: token }])
          .select()
          .single();

        if (cardError) {
          if (cardError.code === '23505') {
            throw new Error('Este código já existe! Tente outro.');
          }
          throw cardError;
        }
        cardId = cardData.id;
      }

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = Date.now();

        // PASSO A: COMPRESSÃO
        const compressionOptions = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, compressionOptions);

        // PASSO B: MARCA D'ÁGUA
        const watermarkedBlob = await applyWatermark(compressedFile);
        const watermarkedFile = new File(
          [watermarkedBlob],
          `wm_${safeFileName}`,
          { type: 'image/jpeg' }
        );

        // Define os nomes dos arquivos organizados na pasta correta
        const fileNameOriginal = `${folderName}/original_${timestamp}_${i}_${safeFileName}`;
        const fileNamePublic = `${folderName}/display_${timestamp}_${i}.jpg`;

        // Upload Original
        await supabase.storage.from('photos').upload(fileNameOriginal, file);

        // Upload Vitrine
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileNamePublic, watermarkedFile);

        if (uploadError) throw uploadError;

        // Pega URLs
        const {
          data: { publicUrl: thumbUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNamePublic);
        const {
          data: { publicUrl: origUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNameOriginal);

        // Monta o objeto da foto dependendo do modo
        uploadedPhotos.push({
          url: origUrl,
          thumbnail_url: thumbUrl,
          price: 15.0,
          filename: fileNameOriginal,
          is_public: uploadMode === 'public', // Define se a foto é pública
          ...(uploadMode === 'private' && { card_id: cardId }), // Só adiciona card_id se for privado
        });
      }

      // Salva no banco de dados
      const { error: photosError } = await supabase
        .from('photos')
        .insert(uploadedPhotos);

      if (photosError) throw photosError;

      setStatus({
        type: 'success',
        msg: `Sucesso! ${files.length} fotos enviadas para a galeria ${
          uploadMode === 'public' ? 'pública' : token
        }.`,
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

  // --- TELA 1: LOGIN ---
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

  // --- TELA 2: DASHBOARD (SELEÇÃO) ---
  if (uploadMode === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Elephoto Admin</span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </header>

        <main className="max-w-4xl mx-auto p-6 mt-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que vamos enviar hoje?
            </h1>
            <p className="text-gray-500 text-lg">
              Selecione o destino das fotos que você deseja fazer o upload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setUploadMode('private')}
              className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
            >
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Fotos do Cliente
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  Álbum privado e seguro. Exige a criação de um código único.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold">
                <ImagePlus className="w-5 h-5 mr-2" /> Enviar fotos privadas
              </div>
            </button>

            <button
              onClick={() => setUploadMode('public')}
              className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
            >
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Fotos Públicas
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  Fotos genéricas (paisagens, detalhes) para a vitrine livre.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-emerald-600 font-semibold">
                <ImagePlus className="w-5 h-5 mr-2" /> Enviar fotos públicas
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- TELA 3: FORMULÁRIO DE UPLOAD (PÚBLICO OU PRIVADO) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setUploadMode('selection');
              setStatus(null);
              setFiles(null);
              setNewToken('');
            }}
            className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">
            {uploadMode === 'private'
              ? 'Novo Álbum Privado'
              : 'Nova Galeria Pública'}
          </span>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            {uploadMode === 'private'
              ? 'Upload de Fotos do Cliente'
              : 'Upload de Fotos Públicas'}
          </h2>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* SÓ MOSTRA O INPUT DE CÓDIGO SE FOR MODO PRIVADO */}
            {uploadMode === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Código do Cliente
                </label>
                <input
                  type="text"
                  value={newToken}
                  onChange={handleTokenChange}
                  maxLength={7}
                  placeholder="EX: ABC1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none uppercase font-semibold tracking-widest font-mono"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obrigatório: Exatamente 3 letras seguidas de 4 números.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {uploadMode === 'private'
                  ? '2. Selecione as Fotos'
                  : '1. Selecione as Fotos'}
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
              disabled={
                loading ||
                (uploadMode === 'private' && newToken.length !== 7) ||
                !files
              }
              className={`w-full text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                uploadMode === 'public'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processando
                  Imagens...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />{' '}
                  {uploadMode === 'public'
                    ? 'Enviar para Vitrine Pública'
                    : 'Criar Álbum do Cliente'}
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
