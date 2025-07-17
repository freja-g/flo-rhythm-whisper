import React from 'react';
import { cn } from '@/lib/utils';

interface FlowerLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const FlowerLoading: React.FC<FlowerLoadingProps> = ({
  className,
  size = 'md',
  message = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Flower Budding Animation */}
      <div className={cn("relative", sizeClasses[size])}>
        {/* Stem */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 bg-green-500 rounded-full animate-grow-stem" />
        
        {/* Leaves */}
        <div className="absolute bottom-1/4 left-1/3 w-3 h-2 bg-green-400 rounded-full transform -rotate-45 animate-grow-leaf opacity-0" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-3 h-2 bg-green-400 rounded-full transform rotate-45 animate-grow-leaf opacity-0" style={{ animationDelay: '0.5s' }} />
        
        {/* Flower Bud */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Petals */}
          <div className="relative w-8 h-8">
            {/* Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-bloom-center opacity-0" style={{ animationDelay: '1s' }} />
            
            {/* Petals - 8 petals in a circle */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-4 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full transform -translate-x-1/2 -translate-y-full origin-bottom animate-bloom-petal opacity-0"
                style={{
                  transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
                  animationDelay: `${1.2 + (i * 0.1)}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Sparkles */}
        <div className="absolute -top-2 -left-2 w-1 h-1 bg-pink-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '2.5s' }} />
        <div className="absolute -top-1 -right-1 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '2.7s' }} />
        <div className="absolute -bottom-1 -right-2 w-1 h-1 bg-green-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '2.9s' }} />
      </div>
      
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
};