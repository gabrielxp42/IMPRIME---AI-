/**
 * SkeletonLoader - Componentes de Loading Skeleton Premium
 * Para feedback visual durante carregamento de conteúdo
 */

import React from 'react';
import './SkeletonLoader.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    animation?: 'wave' | 'pulse' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1em',
    borderRadius,
    className = '',
    variant = 'rectangular',
    animation = 'wave'
}) => {
    const getRadius = () => {
        if (borderRadius) return borderRadius;
        if (variant === 'circular') return '50%';
        if (variant === 'text') return '4px';
        return '8px';
    };

    return (
        <div
            className={`skeleton ${variant} ${animation} ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: getRadius()
            }}
            aria-hidden="true"
        />
    );
};

// Skeleton para thumbnail de imagem
export const ImageSkeleton: React.FC<{ size?: number }> = ({ size = 80 }) => (
    <div className="image-skeleton" style={{ width: size, height: size }}>
        <div className="image-skeleton-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        </div>
        <Skeleton width="100%" height="100%" />
    </div>
);

// Skeleton para card de layer
export const LayerSkeleton: React.FC = () => (
    <div className="layer-skeleton">
        <Skeleton width={40} height={40} borderRadius={6} />
        <div className="layer-skeleton-info">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} />
        </div>
        <div className="layer-skeleton-controls">
            <Skeleton width={24} height={24} variant="circular" />
            <Skeleton width={24} height={24} variant="circular" />
        </div>
    </div>
);

// Skeleton para painel de propriedades
export const PropertiesSkeleton: React.FC = () => (
    <div className="properties-skeleton">
        <div className="properties-skeleton-header">
            <Skeleton width={40} height={40} variant="circular" />
            <div className="properties-skeleton-title">
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
            </div>
        </div>
        <div className="properties-skeleton-group">
            <Skeleton width="30%" height={12} />
            <Skeleton width="100%" height={36} borderRadius={8} />
        </div>
        <div className="properties-skeleton-group">
            <Skeleton width="30%" height={12} />
            <div className="properties-skeleton-row">
                <Skeleton width="48%" height={36} borderRadius={8} />
                <Skeleton width="48%" height={36} borderRadius={8} />
            </div>
        </div>
        <div className="properties-skeleton-group">
            <Skeleton width="25%" height={12} />
            <Skeleton width="100%" height={8} borderRadius={4} />
        </div>
    </div>
);

// Skeleton para canvas durante carregamento
export const CanvasSkeleton: React.FC = () => (
    <div className="canvas-skeleton">
        <div className="canvas-skeleton-inner">
            <ImageSkeleton size={120} />
            <div className="canvas-skeleton-text">
                <Skeleton width={180} height={16} />
                <Skeleton width={120} height={12} />
            </div>
        </div>
    </div>
);

export default Skeleton;
