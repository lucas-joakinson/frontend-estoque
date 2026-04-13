import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: number | string;
}

export const Spinner = ({ className, size = 20 }: SpinnerProps) => {
  return <Loader2 size={size} className={`animate-spin text-primary ${className}`} />;
};
