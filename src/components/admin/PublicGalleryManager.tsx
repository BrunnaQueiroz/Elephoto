import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Save,
  Pencil,
  CheckCircle,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface PublicGalleryManagerProps {
  onBack: () => void;
}

export function PublicGalleryManager({ onBack }: PublicGalleryManagerProps) {
  const [publicGallery, setPublicGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [descInputs, setDescInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    photoId: string | null;
  }>({ show: false, photoId: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Carrega a galeria automaticamente ao abrir
  useEffect(() => {
    loadPublicGallery();
  }, []);

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
          'Bloqueado pelo Supabase. Libere a permissão de DELETE (RLS).'
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
      setToast({ show: true, msg: 'Foto excluída com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setDeleteError('Erro de conexão ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

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
            onClick={onBack}
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
