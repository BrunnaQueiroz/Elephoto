import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface ClientUpsellProps {
  client: { id: string; code: string };
  onBack: () => void;
}

export function ClientUpsell({ client, onBack }: ClientUpsellProps) {
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Carrega os álbuns e as fotos que já estavam recomendadas para esse cliente
  useEffect(() => {
    loadInitialData();
  }, [client.id]);

  // Quando muda o álbum, carrega as fotos dele
  useEffect(() => {
    if (selectedAlbumId) loadPhotosFromAlbum(selectedAlbumId);
  }, [selectedAlbumId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Busca os álbuns públicos
      const { data: albumsData } = await supabase
        .from('public_albums')
        .select('*')
        .order('name');
      if (albumsData) setAlbums(albumsData);

      // 2. Busca quais fotos já estão recomendadas para esse cliente e marca elas
      const { data: upsellsData } = await supabase
        .from('card_upsells')
        .select('photo_id')
        .eq('card_id', client.id);
      if (upsellsData) {
        setSelectedPhotoIds(upsellsData.map(u => u.photo_id));
      }

      if (albumsData && albumsData.length > 0) {
        setSelectedAlbumId(albumsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotosFromAlbum = async (albumId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('public_album_id', albumId)
        .order('created_at', { ascending: false });
      setPhotos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Apaga as recomendações antigas desse cliente
      await supabase.from('card_upsells').delete().eq('card_id', client.id);

      // 2. Insere as novas seleções (se houver alguma)
      if (selectedPhotoIds.length > 0) {
        const inserts = selectedPhotoIds.map(photoId => ({
          card_id: client.id,
          photo_id: photoId,
        }));
        const { error } = await supabase.from('card_upsells').insert(inserts);
        if (error) throw error;
      }

      setToast({ show: true, msg: 'Recomendações salvas com sucesso!' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as recomendações.');
    } finally {
      setSaving(false);
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
            Recomendar fotos para o cliente:{' '}
            <span className="text-purple-600 font-mono">{client.code}</span>
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2 transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar ({selectedPhotoIds.length}) Selecionadas
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        {toast.show && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-medium">{toast.msg}</span>
          </div>
        )}

        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione um Álbum Público para explorar:
          </label>
          <select
            value={selectedAlbumId}
            onChange={e => setSelectedAlbumId(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
          >
            <option value="" disabled>
              Escolha um álbum...
            </option>
            {albums.map(album => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-600" />
            <p>Carregando fotos do álbum...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Este álbum ainda não tem fotos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map(photo => {
              const isSelected = selectedPhotoIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => togglePhotoSelection(photo.id)}
                  className={`relative group aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 border-4 ${
                    isSelected
                      ? 'border-purple-600 scale-95 opacity-90'
                      : 'border-transparent hover:border-purple-300'
                  }`}
                >
                  <img
                    src={photo.thumbnail_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />

                  {/* Ícone de check para fotos selecionadas */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1 shadow-lg">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
