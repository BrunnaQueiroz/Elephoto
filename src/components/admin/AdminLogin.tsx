import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToHome }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const setError = (msg: string | null) => {
    if (msg) setStatus({ type: 'error', msg });
    else setStatus(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const typedLogin = email.trim();

    if (typedLogin === 'admin' && password === 'Eleph@to2026') {
      onLoginSuccess();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('photographers')
        .select('id')
        .eq('username', typedLogin)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        setError('Credenciais inválidas.');
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro de conexão ao tentar fazer login.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const typedLogin = email.trim();

    if (!typedLogin || !password) {
      setError('Preencha um nome de usuário e uma senha.');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('photographers')
        .insert([{ username: typedLogin, password: password }]);

      if (insertError) {
        if (
          insertError.code === '23505' ||
          insertError.message.includes('unique')
        ) {
          setError('Este nome de usuário já está em uso. Escolha outro.');
          return;
        }
        throw insertError;
      }

      setIsRegistering(false);
      setPassword('');
      setStatus({
        type: 'success',
        msg: 'Cadastro realizado com sucesso! Faça seu login abaixo.',
      });
    } catch (err) {
      console.error('Erro no cadastro:', err);
      setError('Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-900">
            {isRegistering ? 'Novo Fotógrafo' : 'Área do Fotógrafo'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {isRegistering ? 'Junte-se ao Elephoto' : 'Acesso restrito'}
          </p>
        </div>
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login
            </label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder={isRegistering ? 'Escolha um nome de usuário' : ''}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none pr-12 transition-all"
                placeholder={isRegistering ? 'Crie uma senha segura' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

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
            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors mt-2 font-medium"
          >
            {isRegistering ? 'Cadastrar' : 'Entrar'}
          </button>

          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            {isRegistering ? (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Já tem uma conta? Entre aqui
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Ainda não é um Elephotografo? Cadastre-se
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full text-gray-400 text-xs hover:text-gray-600 mt-4 transition-colors"
          >
            Voltar para a página inicial
          </button>
        </form>
      </div>
    </div>
  );
}
