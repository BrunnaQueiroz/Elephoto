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
  LayoutList,
  Save,
  Pencil,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export function AdminPage() {
  const { setCurrentView } = useApp();

  // Estados de Autenticação e Navegação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    'selection' | 'private' | 'public' | 'manage'
  >('selection');

  // Estados do Formulário de Upload
  const [newToken, setNewToken] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Estados para o Gerenciador de Vitrine
  const [publicGallery, setPublicGallery] = useState<any[]>([]);
  const [descInputs, setDescInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Estado do Modal de Confirmação de Álbum Existente
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    token: string;
    cardId: string;
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === 'Eleph@to2026') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Credenciais inválidas. ');
    }
  };

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

  const loadPublicGallery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPublicGallery(data || []);

      const initialInputs: Record<string, string> = {};
      data?.forEach(p => {
        initialInputs[p.id] = p.description || '';
      });
      setDescInputs(initialInputs);
    } catch (err) {
      console.error('Erro ao carregar galeria:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveDescription = async (photoId: string) => {
    setUpdatingId(photoId);
    try {
      const newDesc = descInputs[photoId]?.trim() || null;

      const { error } = await supabase
        .from('photos')
        .update({ description: newDesc })
        .eq('id', photoId);

      if (error) throw error;

      setPublicGallery(prev =>
        prev.map(p => (p.id === photoId ? { ...p, description: newDesc } : p))
      );

      setEditingIds(prev => ({ ...prev, [photoId]: false }));

      setToast({ show: true, msg: 'Descrição salva com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const executeUpload = async (cardId: string | null, folderName: string) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setConfirmModal(null);

    try {
      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = Date.now();

        const compressionOptions = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, compressionOptions);

        const watermarkedBlob = await applyWatermark(compressedFile);
        const watermarkedFile = new File(
          [watermarkedBlob],
          `wm_${safeFileName}`,
          { type: 'image/jpeg' }
        );

        const fileNameOriginal = `${folderName}/original_${timestamp}_${i}_${safeFileName}`;
        const fileNamePublic = `${folderName}/display_${timestamp}_${i}.jpg`;

        await supabase.storage.from('photos').upload(fileNameOriginal, file);

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileNamePublic, watermarkedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl: thumbUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNamePublic);
        const {
          data: { publicUrl: origUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNameOriginal);

        uploadedPhotos.push({
          url: origUrl,
          thumbnail_url: thumbUrl,
          price: 15.0,
          filename: fileNameOriginal,
          is_public: uploadMode === 'public',
          description: description.trim() !== '' ? description.trim() : null,
          ...(uploadMode === 'private' && { card_id: cardId }),
        });
      }

      const { error: photosError } = await supabase
        .from('photos')
        .insert(uploadedPhotos);

      if (photosError) throw photosError;

      setStatus({
        type: 'success',
        msg: `Sucesso! ${files.length} fotos enviadas para a galeria ${
          uploadMode === 'public' ? 'pública' : folderName
        }.`,
      });

      setNewToken('');
      setFiles(null);
      setDescription('');
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = newToken.trim().toUpperCase();

    if (uploadMode === 'private') {
      const regex = /^[A-Z]{3}[0-9]{4}$/;
      if (!regex.test(token)) {
        setStatus({
          type: 'error',
          msg: 'O código deve ter exatamente 3 letras seguidas de 4 números (Ex: ABC1234).',
        });
        return;
      }
    }

    if (!files || files.length === 0) return;

    setLoading(true);
    setStatus(null);

    try {
      if (uploadMode === 'private') {
        const { data: existingCard, error: searchError } = await supabase
          .from('cards')
          .select('id')
          .eq('code', token)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existingCard) {
          setLoading(false);
          setConfirmModal({ show: true, token, cardId: existingCard.id });
          return;
        }

        const { data: newCard, error: insertError } = await supabase
          .from('cards')
          .insert([{ code: token }])
          .select()
          .single();

        if (insertError) throw insertError;
        await executeUpload(newCard.id, token);
      } else {
        await executeUpload(null, 'public_gallery');
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        msg: err.message || 'Erro ao preparar upload.',
      });
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
            onClick={() => {
              setIsAuthenticated(false);
              setCurrentView('home');
            }}
            className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que vamos fazer hoje?
            </h1>
            <p className="text-gray-500 text-lg">
              Selecione o destino das fotos ou gerencie sua vitrine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-gray-500 leading-relaxed text-sm">
                  Álbum privado e seguro. Exige a criação de um código único.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold text-sm">
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
                <p className="text-gray-500 leading-relaxed text-sm">
                  Fotos genéricas (paisagens, detalhes) para a vitrine livre.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-emerald-600 font-semibold text-sm">
                <ImagePlus className="w-5 h-5 mr-2" /> Enviar fotos públicas
              </div>
            </button>

            <button
              onClick={() => {
                setUploadMode('manage');
                loadPublicGallery();
              }}
              className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
            >
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                <LayoutList className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Gerenciar Vitrine
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Edite as descrições das fotos que já estão na vitrine pública.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-purple-600 font-semibold text-sm">
                <Save className="w-5 h-5 mr-2" /> Editar Descrições
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- TELA 3.5: GERENCIAR VITRINE ---
  if (uploadMode === 'manage') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUploadMode('selection')}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              Gerenciar Vitrine Pública
            </span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-6 relative">
          {toast.show && (
            <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">{toast.msg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
              <p>Carregando galeria pública...</p>
            </div>
          ) : publicGallery.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Você ainda não tem fotos públicas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publicGallery.map(photo => {
                const isEditing = editingIds[photo.id] || !photo.description;

                return (
                  <div
                    key={photo.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full"
                  >
                    <div className="h-56 w-full bg-gray-100 relative flex-shrink-0">
                      <img
                        src={photo.thumbnail_url}
                        alt="Foto"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Descrição da Imagem
                        </label>
                        {photo.description && !isEditing && (
                          <button
                            onClick={() =>
                              setEditingIds(prev => ({
                                ...prev,
                                [photo.id]: true,
                              }))
                            }
                            className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                            title="Editar descrição"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <>
                          <textarea
                            value={descInputs[photo.id] || ''}
                            onChange={e =>
                              setDescInputs(prev => ({
                                ...prev,
                                [photo.id]: e.target.value,
                              }))
                            }
                            placeholder="Sem descrição... Clique para adicionar."
                            className="w-full flex-1 min-h-[80px] p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                          />
                          <div className="mt-auto flex gap-2">
                            {photo.description && (
                              <button
                                onClick={() => {
                                  setEditingIds(prev => ({
                                    ...prev,
                                    [photo.id]: false,
                                  }));
                                  setDescInputs(prev => ({
                                    ...prev,
                                    [photo.id]: photo.description || '',
                                  }));
                                }}
                                className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                              >
                                Cancelar
                              </button>
                            )}
                            <button
                              onClick={() => saveDescription(photo.id)}
                              disabled={updatingId === photo.id}
                              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingId === photo.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Salvar
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 font-light leading-relaxed flex-1">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- TELA 4: FORMULÁRIO DE UPLOAD ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MODAL DE CONFIRMAÇÃO PARA ÁLBUM EXISTENTE */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Álbum já existente
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              O álbum{' '}
              <strong className="text-gray-900">{confirmModal.token}</strong> já
              existe. Deseja adicionar estas {files?.length} novas fotos a ele?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setLoading(false);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  executeUpload(confirmModal.cardId, confirmModal.token)
                }
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Sim, adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setUploadMode('selection');
              setStatus(null);
              setFiles(null);
              setNewToken('');
              setDescription('');
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
          onClick={() => {
            setIsAuthenticated(false);
            setCurrentView('home');
          }}
          className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-6 relative">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            {uploadMode === 'private'
              ? 'Upload de Fotos do Cliente'
              : 'Upload de Fotos Públicas'}
          </h2>

          <form onSubmit={handleUpload} className="space-y-6">
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

            {uploadMode === 'public' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Descrição Opcional
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Ensaio de casamento na praia (aplicado a todas)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Essa descrição será exibida para o cliente na vitrine.
                </p>
              </div>
            )}

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
