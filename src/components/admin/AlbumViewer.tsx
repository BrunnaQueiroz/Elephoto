import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react';

interface AlbumViewerProps {
  album: { id: string; name: string };
  onBack: () => void;
  onAddPhotos: () => void;
}

export function AlbumViewer({ album, onBack, onAddPhotos }: AlbumViewerProps) {
  const [albumPhotos, setAlbumPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    photoId: string | null;
  }>({ show: false, photoId: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAlbumPhotos();
  }, [album.id]);

  const loadAlbumPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('public_album_id', album.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAlbumPhotos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deletePassword !== '1502') {
      setDeleteError('Senha incorreta.');
      return;
    }
    if (!deleteModal.photoId) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const photoToDelete = albumPhotos.find(p => p.id === deleteModal.photoId);
      const { data, error } = await supabase
        .from('photos')
        .delete()
        .eq('id', deleteModal.photoId)
        .select();
      if (error) throw error;

      if (!data || data.length === 0) {
        setDeleteError('Bloqueado pelo Supabase. Libere RLS.');
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
        if (filesToRemove.length > 0)
          await supabase.storage.from('photos').remove(filesToRemove);
      }

      setAlbumPhotos(prev => prev.filter(p => p.id !== deleteModal.photoId));
      setDeleteModal({ show: false, photoId: null });
      setDeletePassword('');
    } catch (err) {
      console.error(err);
      setDeleteError('Erro ao excluir.');
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
            className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">
            Fotos de: {album.name}
          </span>
        </div>
        <button
          onClick={onAddPhotos}
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
