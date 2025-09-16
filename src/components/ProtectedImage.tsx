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

  // For contain mode, use a completely different approach
  const isContainMode = objectFit === 'contain';

  if (isContainMode) {
    return (
      <div className={`${className} relative w-full h-full flex items-center justify-center bg-black/10`}>
        <img
          src={src}
          alt={alt}
          className="select-none pointer-events-none max-w-full max-h-full"
          style={{
            ...style,
            objectFit: 'contain',
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
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
  }

  return (
    <div className={`${className} relative w-full h-full`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full select-none pointer-events-none"
        style={{
          ...style,
          objectFit: objectFit,
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