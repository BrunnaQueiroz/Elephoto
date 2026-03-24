import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Plus,
  ImagePlus,
  Trash2,
  CheckCircle,
  Loader2,
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

  // Carrega os álbuns automaticamente ao abrir a tela
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

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    // 1. Pede a senha para evitar acidentes
    const pass = window.prompt(
      `ALERTA: Isso apagará o álbum "${albumName}" e TODAS as fotos que estão dentro dele definitivamente.\n\nDigite a senha de autorização:`
    );
    if (pass !== '1502' && pass !== 'moises') {
      if (pass !== null) alert('Senha incorreta. Exclusão cancelada.');
      return;
    }

    setLoading(true);
    try {
      // 2. Busca as fotos desse álbum para podermos apagar os arquivos físicos no Storage
      const { data: photos } = await supabase
        .from('photos')
        .select('filename, thumbnail_url')
        .eq('public_album_id', albumId);

      // 3. Apaga as fotos da tabela do banco de dados primeiro
      await supabase.from('photos').delete().eq('public_album_id', albumId);

      // 4. Depois, apaga o álbum em si
      const { error } = await supabase
        .from('public_albums')
        .delete()
        .eq('id', albumId);
      if (error) throw error;

      // 5. Por fim, apaga os arquivos físicos no Storage para liberar seu espaço
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

      setPublicAlbums(prev => prev.filter(a => a.id !== albumId));
      setToast({ show: true, msg: 'Álbum e fotos removidos com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar álbum. Verifique as permissões no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !newAlbumName}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
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
                  onClick={() => onOpenAlbum(album)}
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteAlbum(album.id, album.name)}
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
