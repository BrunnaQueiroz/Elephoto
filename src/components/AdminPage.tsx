import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import {
  Upload,
  Plus,
  LogOut,
  Image as ImageIcon,
  Loader2,
  ImagePlus,
  ArrowLeft,
  Save,
  Pencil,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';

export function AdminPage() {
  const { setCurrentView } = useApp();

  // --- HOOK DE UPLOAD ---
  const { uploadPhotos, isUploading, uploadProgress } = usePhotoUpload();

  // --- ESTADOS GERAIS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    'selection' | 'private' | 'public' | 'manage' | 'clients' | 'manage_albums'
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
  const [toast, setToast] = useState({ show: false, msg: '' });

  // --- ESTADOS DA VITRINE E ÁLBUNS ---
  const [publicGallery, setPublicGallery] = useState<any[]>([]);
  const [descInputs, setDescInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    photoId: string | null;
  }>({ show: false, photoId: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [publicAlbums, setPublicAlbums] = useState<any[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<any[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    token: string;
    cardId: string;
  } | null>(null);
  const [clientsList, setClientsList] = useState<any[]>([]);

  // --- FUNÇÕES AUXILIARES ---
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewToken(e.target.value.toUpperCase());
  };

  const setError = (msg: string | null) => {
    if (msg) setStatus({ type: 'error', msg });
    else setStatus(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => {
      const newArray = [...prev];
      URL.revokeObjectURL(newArray[indexToRemove].preview);
      newArray.splice(indexToRemove, 1);
      return newArray;
    });
  };

  // --- FUNÇÕES DA VITRINE ---
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
      const photoToDelete =
        publicGallery.find(p => p.id === deleteModal.photoId) ||
        albumPhotos.find(p => p.id === deleteModal.photoId);
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
      setAlbumPhotos(prev => prev.filter(p => p.id !== deleteModal.photoId));
      setDeleteModal({ show: false, photoId: null });
      setDeletePassword('');
      setToast({ show: true, msg: 'Foto excluída com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setDeleteError('Erro de conexão ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNÇÕES DE UPLOAD ---
  const processUpload = async (
    targetId: string | null,
    folderName: string,
    isPublic: boolean
  ) => {
    setConfirmModal(null);
    setStatus(null);

    try {
      await uploadPhotos({
        files: selectedFiles,
        folderName,
        isPublic,
        albumId: isPublic ? targetId : null,
        cardId: !isPublic ? targetId : null,
        description,
      });

      setStatus({
        type: 'success',
        msg: `Sucesso! ${selectedFiles.length} fotos enviadas.`,
      });

      setNewToken('');
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setDescription('');

      if (selectedAlbum) {
        loadAlbumPhotos(selectedAlbum.id);
        setUploadMode('manage_albums');
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: err.message || 'Erro ao realizar upload.',
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setStatus(null);

    try {
      if (uploadMode === 'private') {
        const token = newToken.trim().toUpperCase();
        if (!token) {
          setError('Defina um código para o álbum privado.');
          return;
        }

        setLoading(true);
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
        setLoading(false);
        await processUpload(newCard.id, token, false);
      } else {
        const folderName = selectedAlbum
          ? `album_${selectedAlbum.name}`
          : 'public_gallery';
        const albumId = selectedAlbum ? selectedAlbum.id : null;
        await processUpload(albumId, folderName, true);
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

  // --- FUNÇÕES DE CLIENTES ---
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (cardId: string, cardCode: string) => {
    const pass = window.prompt(
      `ALERTA: Apagar cliente ${cardCode} e fotos? Digite a senha:`
    );
    if (pass !== '1502' && pass !== 'moises') {
      if (pass !== null) alert('Senha incorreta.');
      return;
    }

    setLoading(true);
    try {
      const { data: photos } = await supabase
        .from('photos')
        .select('filename, thumbnail_url')
        .eq('card_id', cardId);
      await supabase.from('photos').delete().eq('card_id', cardId);
      const { error: cardError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      if (cardError) throw cardError;

      if (photos && photos.length > 0) {
        const filesToRemove: string[] = [];
        photos.forEach(p => {
          if (p.filename) filesToRemove.push(p.filename);
          if (p.thumbnail_url) {
            const urlParts = p.thumbnail_url.split('/photos/');
            if (urlParts.length > 1) filesToRemove.push(urlParts[1]);
          }
        });
        if (filesToRemove.length > 0)
          await supabase.storage.from('photos').remove(filesToRemove);
      }

      setClientsList(prev => prev.filter(c => c.id !== cardId));
      setToast({ show: true, msg: `Cliente excluído!` });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir cliente.');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE ÁLBUNS PÚBLICOS ---
  const loadPublicAlbums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_albums')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPublicAlbums(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumPhotos = async (albumId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('public_album_id', albumId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAlbumPhotos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAlbum = (album: any) => {
    setSelectedAlbum(album);
    loadAlbumPhotos(album.id);
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_albums')
        .insert([{ name: newAlbumName.trim() }])
        .select()
        .single();
      if (error) throw error;
      setPublicAlbums(prev => [data, ...prev]);
      setNewAlbumName('');
      setToast({ show: true, msg: `Álbum criado!` });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar álbum.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (
      !window.confirm(
        `Apagar álbum "${albumName}"? As fotos ficarão sem álbum.`
      )
    )
      return;
    setLoading(true);
    try {
      await supabase
        .from('photos')
        .update({ public_album_id: null })
        .eq('public_album_id', albumId);
      const { error } = await supabase
        .from('public_albums')
        .delete()
        .eq('id', albumId);
      if (error) throw error;
      setPublicAlbums(prev => prev.filter(a => a.id !== albumId));
      setToast({ show: true, msg: 'Álbum removido!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar álbum.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DAS TELAS
  // ==========================================

  // --- TELA 1: LOGIN ---
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToHome={() => setCurrentView('home')}
      />
    );
  }

  // --- TELA 2: DASHBOARD (MENU) ---
  if (uploadMode === 'selection') {
    return (
      <AdminDashboard
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentView('home');
        }}
        onNavigate={mode => setUploadMode(mode)}
        loadPublicGallery={loadPublicGallery}
        loadClients={loadClients}
        loadPublicAlbums={loadPublicAlbums}
        clearSelectedAlbum={() => setSelectedAlbum(null)}
      />
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
                Esta ação apagará a foto do sistema. Digite a senha para
                confirmar.
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3 px-1">
                      <div
                        onClick={() => setShowProfileModal(true)}
                        className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-100 shadow-sm cursor-pointer hover:scale-110 transition-transform duration-200"
                      >
                        <img
                          src="/J. D.jpeg"
                          alt="Jorge"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 leading-tight">
                          J. D'Allambert
                        </span>
                        <span className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">
                          Fotógrafo
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Descrição
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
                              )}{' '}
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
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src="/J. D.jpeg"
                alt="Ampliado"
                className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- TELA DE ÁLBUNS PÚBLICOS ---
  if (uploadMode === 'manage_albums') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUploadMode('selection')}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              Organizar Álbuns Públicos
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
          <form
            onSubmit={handleCreateAlbum}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex gap-4"
          >
            <input
              type="text"
              placeholder="Ex: Praia da Barra - 2026"
              value={newAlbumName}
              onChange={e => setNewAlbumName(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !newAlbumName}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Criar Álbum
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publicAlbums.map(album => (
              <div
                key={album.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-all"
              >
                <div>
                  <h3 className="font-bold text-gray-900">{album.name}</h3>
                  <p className="text-xs text-gray-400">
                    Criado em{' '}
                    {new Date(album.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => openAlbum(album)}
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAlbum(album.id, album.name)}
                    className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- TELA: CONTEÚDO DO ÁLBUM ESPECÍFICO ---
  if (selectedAlbum) {
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
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              Fotos de: {selectedAlbum.name}
            </span>
          </div>
          <button
            onClick={() => {
              setUploadMode('public');
              setNewToken('');
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar Novas Fotos
          </button>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p>Carregando fotos...</p>
            </div>
          ) : albumPhotos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Este álbum ainda não tem fotos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albumPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                >
                  <img
                    src={photo.thumbnail_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <button
                    onClick={() =>
                      setDeleteModal({ show: true, photoId: photo.id })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- TELA DE GERENCIAR CLIENTES ---
  if (uploadMode === 'clients') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUploadMode('selection')}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
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
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  processUpload(confirmModal.cardId, confirmModal.token, false)
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
              if (selectedAlbum) {
                setUploadMode('manage_albums');
              } else {
                setUploadMode('selection');
              }
              setStatus(null);
              setSelectedFiles([]);
              setNewToken('');
              setDescription('');
            }}
            className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">
            {uploadMode === 'private'
              ? 'Novo Álbum Privado'
              : selectedAlbum
              ? `Adicionando a: ${selectedAlbum.name}`
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
                  disabled={isUploading}
                />
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
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
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

              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 animate-in fade-in zoom-in-95 duration-200">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                    >
                      <img
                        src={item.preview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:scale-110 transition-all shadow-md"
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
                  placeholder="Ex: Ensaio de casamento na praia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  disabled={isUploading}
                />
              </div>
            )}

            {status && (
              <div
                className={`p-4 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-top-2 ${
                  status.type === 'success'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isUploading ||
                (uploadMode === 'private' && newToken.trim() === '') ||
                selectedFiles.length === 0
              }
              className={`w-full text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                uploadMode === 'public'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />{' '}
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
