import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Plus,
  ImagePlus,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AlbumManagerProps {
  onBack: () => void;
  onOpenAlbum: (album: { id: string; name: string }) => void;
}

export function AlbumManager({ onBack, onOpenAlbum }: AlbumManagerProps) {
  const [publicAlbums, setPublicAlbums] = useState<any[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // --- ESTADOS DO NOVO MODAL DE EXCLUSÃO ---
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    albumId: string | null;
    albumName: string;
  }>({ show: false, albumId: null, albumName: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPublicAlbums();
  }, []);

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
      console.error('Erro ao carregar álbuns:', err);
    } finally {
      setLoading(false);
    }
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

  // Função que apenas abre o modal
  const triggerDelete = (albumId: string, albumName: string) => {
    setDeleteModal({ show: true, albumId, albumName });
    setDeletePassword('');
    setDeleteError('');
  };

  // Função que executa a exclusão quando clica no botão dentro do modal
  const confirmDelete = async () => {
    if (deletePassword !== '1502' && deletePassword !== 'moises') {
      setDeleteError('Senha incorreta. Tente novamente.');
      return;
    }

    if (!deleteModal.albumId) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const { data: photos } = await supabase
        .from('photos')
        .select('filename, thumbnail_url')
        .eq('public_album_id', deleteModal.albumId);

      await supabase
        .from('photos')
        .delete()
        .eq('public_album_id', deleteModal.albumId);

      const { error } = await supabase
        .from('public_albums')
        .delete()
        .eq('id', deleteModal.albumId);
      if (error) throw error;

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

      setPublicAlbums(prev => prev.filter(a => a.id !== deleteModal.albumId));
      setDeleteModal({ show: false, albumId: null, albumName: '' });
      setToast({ show: true, msg: 'Álbum e fotos removidos com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      setDeleteError('Erro ao apagar álbum. Verifique sua conexão.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* --- MODAL DE EXCLUSÃO CUSTOMIZADO --- */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Excluir Álbum?
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Isso apagará o álbum{' '}
              <strong className="text-gray-900">
                "{deleteModal.albumName}"
              </strong>{' '}
              e TODAS as fotos dentro dele. Digite a senha para confirmar.
            </p>

            <input
              type="password"
              placeholder="Senha de autorização"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-center tracking-widest text-lg font-mono"
              disabled={isDeleting}
            />

            {deleteError && (
              <p className="text-red-500 text-sm mb-4 animate-in fade-in">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, albumId: null, albumName: '' })
                }
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
                  'Excluir Álbum'
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
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !newAlbumName}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}{' '}
            Criar Álbum
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {publicAlbums.map(album => (
            <div
              key={album.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all"
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
                  onClick={() => onOpenAlbum(album)}
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => triggerDelete(album.id, album.name)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
