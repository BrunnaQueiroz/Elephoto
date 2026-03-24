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
  X,
  Trash2,
} from 'lucide-react';

export function AdminPage() {
  const { setCurrentView } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [uploadMode, setUploadMode] = useState<
  //   'selection' | 'private' | 'public' | 'manage'
  // >('selection');
  const [uploadMode, setUploadMode] = useState<
    'selection' | 'private' | 'public' | 'manage' | 'clients'
  >('selection');

  const [newToken, setNewToken] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const [publicGallery, setPublicGallery] = useState<any[]>([]);
  const [descInputs, setDescInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Estados para o Modal de Exclusão
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    photoId: string | null;
  }>({ show: false, photoId: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    token: string;
    cardId: string;
  } | null>(null);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewToken(e.target.value.toUpperCase());
  };
  // Controle de progresso do upload
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  const setError = (msg: string | null) => {
    if (msg) setStatus({ type: 'error', msg });
    else setStatus(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const typedLogin = email.trim();

    // Verifica se é o admin master OU o novo acesso do Lambert
    if (
      (typedLogin === 'admin' && password === 'Eleph@to2026') ||
      (typedLogin === "J.D'Allambert" && password === 'moises')
    ) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Credenciais inválidas.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file), // Gera a miniatura provisória
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };
  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => {
      const newArray = [...prev];
      URL.revokeObjectURL(newArray[indexToRemove].preview); // Libera a memória
      newArray.splice(indexToRemove, 1);
      return newArray;
    });
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

  const confirmDelete = async () => {
    if (deletePassword !== '1502') {
      setDeleteError('Senha incorreta. Tente novamente.');
      return;
    }
    if (!deleteModal.photoId) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const photoToDelete = publicGallery.find(
        p => p.id === deleteModal.photoId
      );
      const { data, error } = await supabase
        .from('photos')
        .delete()
        .eq('id', deleteModal.photoId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        setDeleteError(
          'Bloqueado pelo Supabase. Libere a permissão de DELETE (RLS) no painel.'
        );
        setIsDeleting(false);
        return;
      }

      if (photoToDelete) {
        const filesToRemove = [];
        if (photoToDelete.filename) filesToRemove.push(photoToDelete.filename);
        if (photoToDelete.thumbnail_url) {
          const urlParts = photoToDelete.thumbnail_url.split('/photos/');
          if (urlParts.length > 1) filesToRemove.push(urlParts[1]);
        }
        if (filesToRemove.length > 0) {
          await supabase.storage.from('photos').remove(filesToRemove);
        }
      }

      setPublicGallery(prev => prev.filter(p => p.id !== deleteModal.photoId));
      setDeleteModal({ show: false, photoId: null });
      setDeletePassword('');
      setToast({ show: true, msg: 'Foto e arquivos excluídos com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setDeleteError('Erro de conexão ao excluir. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const executeUpload = async (cardId: string | null, folderName: string) => {
    if (selectedFiles.length === 0) return;
    setLoading(true);
    setConfirmModal(null);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const uploadedPhotos = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: selectedFiles.length });

        const file = selectedFiles[i].file;

        // ---> 1.  RESOLUÇÃO DA FOTO ORIGINAL
        const dimensions = await getImageDimensions(file);
        const resolutionString = `${dimensions.width} x ${dimensions.height} px`;

        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = Date.now();
        const compressionOptions = {
          maxSizeMB: 0.6,
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

        await Promise.all([
          supabase.storage.from('photos').upload(fileNameOriginal, file),
          supabase.storage
            .from('photos')
            .upload(fileNamePublic, watermarkedFile),
        ]);

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
          resolution: resolutionString, // ---> 2. SALVANDO A RESOLUÇÃO AQUI <---
          ...(uploadMode === 'private' && { card_id: cardId }),
        });
      }

      const { error: photosError } = await supabase
        .from('photos')
        .insert(uploadedPhotos);

      if (photosError) throw photosError;

      setStatus({
        type: 'success',
        msg: `Sucesso! ${selectedFiles.length} fotos enviadas para a galeria ${
          uploadMode === 'public' ? 'pública' : folderName
        }.`,
      });
      setNewToken('');

      // Limpa os arquivos da memória
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        msg: err.message || 'Erro ao realizar upload.',
      });
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 }); // Zera o contador
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = newToken.trim().toUpperCase();

    if (selectedFiles.length === 0) return;
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

        // SE O ÁLBUM EXISTE, MOSTRA O MODAL E PARA O UPLOAD
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

  // --- ESTADOS E FUNÇÕES DE GERENCIAR CLIENTES ---

  const [clientsList, setClientsList] = useState<any[]>([]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClientsList(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (cardId: string, cardCode: string) => {
    const pass = window.prompt(
      `ALERTA: Isso apagará o cliente ${cardCode} e TODAS as suas fotos do banco e do storage.\n\nDigite a senha de autorização:`
    );

    // Aceita tanto a senha master quanto a do Lambert
    if (pass !== '1502' && pass !== 'moises') {
      if (pass !== null) alert('Senha incorreta. Exclusão cancelada.');
      return;
    }

    setLoading(true);
    try {
      // 1. Busca as fotos para poder apagar os arquivos físicos no Storage
      const { data: photos } = await supabase
        .from('photos')
        .select('filename, thumbnail_url')
        .eq('card_id', cardId);

      // 2. Apaga as fotos da tabela (para não dar erro de chave estrangeira)
      await supabase.from('photos').delete().eq('card_id', cardId);

      // 3. Apaga o álbum (card) da tabela
      const { error: cardError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      if (cardError) throw cardError;

      // 4. Apaga os arquivos físicos no Storage para liberar espaço
      if (photos && photos.length > 0) {
        const filesToRemove: string[] = [];
        photos.forEach(p => {
          if (p.filename) filesToRemove.push(p.filename);
          if (p.thumbnail_url) {
            const urlParts = p.thumbnail_url.split('/photos/');
            if (urlParts.length > 1) filesToRemove.push(urlParts[1]);
          }
        });
        if (filesToRemove.length > 0) {
          await supabase.storage.from('photos').remove(filesToRemove);
        }
      }

      // 5. Atualiza a tela
      setClientsList(prev => prev.filter(c => c.id !== cardId));
      setToast({ show: true, msg: `Cliente ${cardCode} excluído!` });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      alert(
        'Erro ao excluir. Verifique se o Supabase tem permissão de DELETE na tabela cards.'
      );
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

  // --- TELA 2: DASHBOARD COM 3 BOTÕES ---
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
            {/* NOVO BOTÃO: GERENCIAR CLIENTES */}
            <button
              onClick={() => {
                setUploadMode('clients');
                loadClients();
              }}
              className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
            >
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                <LayoutList className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Gerenciar Clientes
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Visualize todos os álbuns criados e exclua clientes antigos.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-orange-600 font-semibold text-sm">
                <Trash2 className="w-5 h-5 mr-2" /> Limpar Base de Clientes
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- TELA 3: GERENCIAR VITRINE ---
  if (uploadMode === 'manage') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Excluir Foto?
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Esta ação apagará a foto do sistema. Digite a senha de
                autorização para confirmar.
              </p>

              <input
                type="password"
                placeholder="Senha"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-center tracking-widest text-lg font-mono"
              />

              {deleteError && (
                <p className="text-red-500 text-sm mb-4 animate-in fade-in">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setDeleteModal({ show: false, photoId: null });
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full group"
                  >
                    <div className="h-56 w-full bg-gray-100 relative flex-shrink-0">
                      <img
                        src={photo.thumbnail_url}
                        alt="Foto"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setDeleteModal({ show: true, photoId: photo.id })
                        }
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3 px-1">
                      <div
                        onClick={() => setShowProfileModal(true)}
                        className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-100 shadow-sm cursor-pointer hover:scale-110 transition-transform duration-200"
                        title="Ampliar foto"
                      >
                        <img
                          src="/J. D.jpeg"
                          alt="Jorge Lambert"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 leading-tight">
                          J. D'Allambert
                        </span>
                        <span className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">
                          Fotógrafo Parceiro
                        </span>
                      </div>
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
        {showProfileModal && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowProfileModal(false)}
          >
            <div
              className="relative max-w-sm w-full animate-in zoom-in-95 duration-300"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors p-2"
                title="Fechar"
              >
                <X className="w-8 h-8" />
              </button>

              <img
                src="/J. D.jpeg"
                alt="Jorge Lambert Ampliado"
                className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
  // --- NOVA TELA: GERENCIAR CLIENTES ---
  if (uploadMode === 'clients') {
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
              Base de Clientes
            </span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 mt-6">
          {toast.show && (
            <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">{toast.msg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
              <p>Carregando clientes...</p>
            </div>
          ) : clientsList.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">Nenhum cliente cadastrado ainda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">
                      Código do Álbum
                    </th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">
                      Data de Criação
                    </th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientsList.map(client => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">
                        {client.code}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(client.created_at).toLocaleDateString(
                          'pt-BR'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            handleDeleteClient(client.id, client.code)
                          }
                          className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- TELA 4: UPLOAD DE FOTOS ---
  return (
    <div className="min-h-screen bg-gray-50">
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Álbum já existente
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              O álbum{' '}
              <strong className="text-gray-900">{confirmModal.token}</strong> já
              existe. Deseja adicionar estas {selectedFiles.length} novas fotos
              a ele?
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
              setSelectedFiles([]);
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
                  maxLength={12}
                  placeholder="EX: MEUALBUM123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none uppercase font-semibold tracking-widest font-mono"
                  disabled={loading}
                />
              </div>
            )}

            {/* SECÇÃO 2: SELEÇÃO DE FOTOS E GRID DE MINIATURAS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {uploadMode === 'private'
                  ? '2. Selecione as Fotos'
                  : '1. Selecione as Fotos'}
              </label>

              {/* ÁREA DE CLICK E ARRASTAR (CAIXA TRACEJADA) */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="flex flex-col items-center pointer-events-none">
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} arquivos selecionados`
                      : 'Clique ou arraste as fotos aqui'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>

              {/* >>> O GRID DE MINIATURAS ENTRA AQUI! <<< */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 animate-in fade-in zoom-in-95 duration-200">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                    >
                      <img
                        src={item.preview}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      {/* BOTÃO DE EXCLUIR MINIATURA */}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:scale-110 transition-all shadow-md"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                (uploadMode === 'private' && newToken.trim() === '') ||
                selectedFiles.length === 0
              }
              className={`w-full text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                uploadMode === 'public'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadProgress.total > 0
                    ? `Enviando foto ${uploadProgress.current} de ${uploadProgress.total}...`
                    : 'Processando Imagens...'}
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
