import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile } from '../hooks/useProfile';
import { useAuthContext } from '../contexts/AuthContext';
import { changePasswordSchema, type ChangePasswordInput } from '../schemas/profile.schema';
import { Shield, Key, Eye, EyeOff, Camera, Check, Edit2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { toast } from 'sonner';

export const Profile = () => {
  const { user } = useAuthContext();
  const { updateProfile, isUpdatingProfile, changePassword, isChangingPassword, uploadAvatar, isUploadingAvatar } = useProfile();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const displayName = user?.name || 'Usuário';
  const displayRole = user?.role || 'Operador';
  const displayMatricula = user?.matricula || '---';

  const onUpdateName = () => {
    if (newName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    if (!newName.trim()) {
      toast.error('O nome não pode estar vazio');
      return;
    }
    updateProfile(newName, {
      onSuccess: () => setIsEditingName(false),
    });
  };

  const onPasswordSubmit = (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => resetPassword(),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formatos aceitos: JPG, PNG, WebP');
      return;
    }

    uploadAvatar(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-text-primary leading-tight">Meu Perfil</h2>
        <p className="text-text-secondary mt-1 font-mono text-xs uppercase tracking-widest">
          Gerencie suas informações e segurança da conta
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border-primary rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-sm">
            <div className="relative group">
              <Avatar 
                name={displayName} 
                avatarUrl={user?.avatarUrl} 
                size="xl" 
                className="ring-4 ring-primary-500/10"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-500 text-white shadow-glow-purple hover:bg-primary-400 transition-all group-hover:scale-110 disabled:opacity-50"
              >
                {isUploadingAvatar ? <Spinner size={14} /> : <Camera size={16} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2 w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    className="flex-1 bg-hover-bg border border-primary-500/50 rounded-xl px-4 py-2 text-sm font-bold text-text-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && onUpdateName()}
                  />
                  <button 
                    onClick={onUpdateName}
                    disabled={isUpdatingProfile}
                    className="p-2 rounded-xl bg-primary-500 text-white shadow-glow-purple"
                  >
                    {isUpdatingProfile ? <Spinner size={16} /> : <Check size={16} />}
                  </button>
                  <button 
                    onClick={() => { setIsEditingName(false); setNewName(user?.name || ''); }}
                    className="p-2 rounded-xl bg-hover-bg text-text-secondary border border-border-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group">
                  <h3 className="text-xl font-bold text-text-primary">{displayName}</h3>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-primary-400 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em]">
                {displayMatricula}
              </p>
            </div>

            <div className="pt-4 w-full border-t border-border-primary space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-text-secondary uppercase">Cargo</span>
                <span className={`px-2 py-0.5 rounded-full border ${user?.role === 'ADMIN' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  {displayRole}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-text-secondary uppercase">Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-tighter">Ativo</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-primary rounded-3xl p-6 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Shield size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-primary font-mono uppercase tracking-tight">Segurança</h4>
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tighter font-mono">
                Não compartilhe sua matrícula e senha com ninguém. Toda alteração no estoque fica registrada em seu nome.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface border border-border-primary rounded-3xl p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400">
                <Key size={20} />
              </div>
              <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-widest">Alterar Senha de Acesso</h3>
            </div>

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest ml-1">Senha Atual</label>
                <div className="relative group">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${passwordErrors.currentPassword ? 'border-red-500' : 'border-border-primary group-focus-within:border-primary-500/50'}`}
                    placeholder="••••••••"
                    {...registerPassword('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="text-[10px] text-red-500 font-mono ml-1">{passwordErrors.currentPassword.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative group">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${passwordErrors.newPassword ? 'border-red-500' : 'border-border-primary group-focus-within:border-primary-500/50'}`}
                      placeholder="••••••••"
                      {...registerPassword('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <span className="text-[10px] text-red-500 font-mono ml-1">{passwordErrors.newPassword.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full px-4 py-3 rounded-xl bg-hover-bg border text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-border-primary group-focus-within:border-primary-500/50'}`}
                      placeholder="••••••••"
                      {...registerPassword('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <span className="text-[10px] text-red-500 font-mono ml-1">{passwordErrors.confirmPassword.message}</span>}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-400 text-white font-mono font-bold uppercase tracking-widest transition-all shadow-glow-purple flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isChangingPassword ? <Spinner /> : (
                    <>
                      <span>Atualizar Senha</span>
                      <Shield size={18} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
