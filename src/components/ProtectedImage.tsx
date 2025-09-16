import React from 'react';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

const ProtectedImage: React.FC<ProtectedImageProps> = ({ src, alt, className = '', style = {}, objectFit = 'cover' }) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // For contain mode, use different approach to ensure image is properly centered and sized
  const isContainMode = objectFit === 'contain';

  return (
    <div className={`${className} relative w-full h-full ${isContainMode ? 'flex items-center justify-center bg-black/5' : ''}`}>
      <img
        src={src}
        alt={alt}
        className={`select-none pointer-events-none ${isContainMode ? 'max-w-full max-h-full object-contain' : 'w-full h-full'}`}
        style={{
          ...style,
          objectFit: isContainMode ? 'contain' : objectFit,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          KhtmlUserSelect: 'none'
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable={false}
      />
      {/* Invisible overlay to prevent right-click */}
      <div
        className="absolute inset-0 z-10 pointer-events-auto"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{ userSelect: 'none' }}
      />
    </div>
  );
};

export default ProtectedImage;