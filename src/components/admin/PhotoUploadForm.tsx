import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import {
  Upload,
  Plus,
  LogOut,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

interface PhotoUploadFormProps {
  uploadMode: 'private' | 'public';
  selectedAlbum: { id: string; name: string } | null;
  onBack: () => void;
  onLogout: () => void;
  onSuccess: () => void;
}

export function PhotoUploadForm({
  uploadMode,
  selectedAlbum,
  onBack,
  onLogout,
  onSuccess,
}: PhotoUploadFormProps) {
  const { uploadPhotos, isUploading, uploadProgress } = usePhotoUpload();
  const [newToken, setNewToken] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    token: string;
    cardId: string;
  } | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // --- NOVOS ESTADOS PARA A SEÇÃO 3 ---
  const [publicAlbums, setPublicAlbums] = useState<any[]>([]);
  const [selectedUpsellAlbums, setSelectedUpsellAlbums] = useState<string[]>(
    []
  );

  // Busca os álbuns públicos caso estejamos no modo de upload para clientes
  useEffect(() => {
    if (uploadMode === 'private') {
      const fetchAlbums = async () => {
        const { data } = await supabase
          .from('public_albums')
          .select('*')
          .order('name');
        if (data) setPublicAlbums(data);
      };
      fetchAlbums();
    }
  }, [uploadMode]);

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

  const toggleUpsellAlbum = (albumId: string) => {
    setSelectedUpsellAlbums(prev =>
      prev.includes(albumId)
        ? prev.filter(id => id !== albumId)
        : [...prev, albumId]
    );
  };

  // Função que cruza os dados e salva as recomendações no banco
  const saveUpsellSelections = async (cardId: string) => {
    if (selectedUpsellAlbums.length === 0) return;
    try {
      // 1. Pega todas as fotos que pertencem aos álbuns selecionados
      const { data: photos } = await supabase
        .from('photos')
        .select('id')
        .in('public_album_id', selectedUpsellAlbums);

      if (photos && photos.length > 0) {
        // 2. Verifica se o cliente já tem recomendações para não duplicar
        const { data: existingUpsells } = await supabase
          .from('card_upsells')
          .select('photo_id')
          .eq('card_id', cardId);
        const existingIds = existingUpsells
          ? existingUpsells.map(u => u.photo_id)
          : [];

        // 3. Filtra apenas as fotos novas e insere
        const newInserts = photos
          .filter(p => !existingIds.includes(p.id))
          .map(p => ({ card_id: cardId, photo_id: p.id }));

        if (newInserts.length > 0) {
          await supabase.from('card_upsells').insert(newInserts);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar recomendações automáticas:', err);
    }
  };

  const processUpload = async (
    targetId: string | null,
    folderName: string,
    isPublic: boolean
  ) => {
    setConfirmModal(null);
    setStatus(null);
    try {
      // Salva as recomendações antes de subir as fotos (se for álbum privado)
      if (!isPublic && targetId) {
        await saveUpsellSelections(targetId);
      }

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
      selectedUpsellAlbums.length = 0; // Limpa a seleção
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setDescription('');
      setTimeout(onSuccess, 1500);
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
          setStatus({ type: 'error', msg: 'Defina um código.' });
          return;
        }

        setLoadingSearch(true);
        const { data: existingCard, error: searchError } = await supabase
          .from('cards')
          .select('id')
          .eq('code', token)
          .maybeSingle();
        if (searchError) throw searchError;

        if (existingCard) {
          setLoadingSearch(false);
          setConfirmModal({ show: true, token, cardId: existingCard.id });
          return;
        }

        const { data: newCard, error: insertError } = await supabase
          .from('cards')
          .insert([{ code: token }])
          .select()
          .single();
        if (insertError) throw insertError;
        setLoadingSearch(false);
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
      setLoadingSearch(false);
    }
  };

  const isBusy = isUploading || loadingSearch;

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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
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
            onClick={onBack}
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
          onClick={onLogout}
          className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-6 relative">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6" />{' '}
            {uploadMode === 'private'
              ? 'Upload de Fotos do Cliente'
              : 'Upload de Fotos Públicas'}
          </h2>

          <form onSubmit={handleUpload} className="space-y-8">
            {uploadMode === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Código do Cliente
                </label>
                <input
                  type="text"
                  value={newToken}
                  onChange={e => setNewToken(e.target.value.toUpperCase())}
                  maxLength={12}
                  placeholder="EX: MEUALBUM123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold tracking-widest font-mono"
                  disabled={isBusy}
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
                  disabled={isBusy}
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

            {/* --- NOVA SEÇÃO 3: ÁLBUNS RECOMENDADOS --- */}
            {uploadMode === 'private' && publicAlbums.length > 0 && (
              <div className="animate-in fade-in duration-300 border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3. Recomendar Álbuns (Opcional)
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  Selecione quais álbuns aparecerão na vitrine de compra extra
                  deste cliente.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {publicAlbums.map(album => {
                    const isSelected = selectedUpsellAlbums.includes(album.id);
                    return (
                      <div
                        key={album.id}
                        onClick={() => !isBusy && toggleUpsellAlbum(album.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                        } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`font-semibold text-sm ${
                            isSelected ? 'text-purple-800' : 'text-gray-700'
                          }`}
                        >
                          {album.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  disabled={isBusy}
                />
              </div>
            )}

            {status && (
              <div
                className={`p-4 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-top-2 ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isBusy ||
                (uploadMode === 'private' && newToken.trim() === '') ||
                selectedFiles.length === 0
              }
              className={`w-full text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm ${
                uploadMode === 'public'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isBusy ? (
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
