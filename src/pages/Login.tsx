import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '../schemas/auth.schema';

export const Login = () => {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-mono tracking-tighter mb-2">
            <span className="text-primary-500">{'>_'}</span> ESTOQUE
          </h1>
          <p className="text-text-secondary font-mono text-xs uppercase tracking-widest">
            Acesse o sistema de gerenciamento
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border-primary rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2 px-1">Matrícula</label>
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${errors.matricula ? 'border-red-500' : 'border-border-primary'}`}
              placeholder="Digite sua matrícula"
              {...register('matricula')}
            />
            {errors.matricula && <span className="text-[10px] text-red-500 font-mono">{errors.matricula.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2 px-1">Senha</label>
            <input
              type="password"
              className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary placeholder:text-text-secondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${errors.password ? 'border-red-500' : 'border-border-primary'}`}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="text-[10px] text-red-500 font-mono">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-2 h-12"
          >
            {isLoggingIn ? <Spinner className="text-white" /> : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] opacity-50">
          Gerenciador de Estoque v2.0 &copy; 2026
        </p>
      </div>
    </div>
  );
};
