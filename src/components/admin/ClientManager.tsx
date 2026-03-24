import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

import { ArrowLeft, Loader2, Trash2, CheckCircle, Star } from 'lucide-react';

interface ClientManagerProps {
  onBack: () => void;
  onUpsell: (client: any) => void; // <--- Adicione esta linha
}

export function ClientManager({ onBack, onUpsell }: ClientManagerProps) {
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Isso faz com que a lista carregue automaticamente assim que a tela abre!
  useEffect(() => {
    loadClients();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">Base de Clientes</span>
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
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpsell(client)}
                        className="text-purple-600 hover:text-white border border-purple-600 hover:bg-purple-600 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" /> Recomendar Fotos
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClient(client.id, client.code)
                        }
                        className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </td>
                    {/* <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDeleteClient(client.id, client.code)
                        }
                        className="text-red-500 hover:text-white border border-red-500 hover:bg-red-500 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </td> */}
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
