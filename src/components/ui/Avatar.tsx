import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar = ({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) => {
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fullAvatarUrl = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${baseUrl}${avatarUrl}`) : null;

  return (
    <div className={`${sizes[size]} rounded-full border border-border-primary flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-500/20 to-primary-700/20 text-primary-400 font-bold font-mono shrink-0 ${className}`}>
      {fullAvatarUrl ? (
        <img 
          src={fullAvatarUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name || 'User')}</span>
      )}
    </div>
  );
};
