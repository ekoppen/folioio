import React from 'react';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

const ProtectedImage: React.FC<ProtectedImageProps> = ({ src, alt, className = '', style = {}, objectFit = 'cover' }) => {
  console.log('ProtectedImage - objectFit prop:', objectFit);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const imageStyle = {
    ...style,
    objectFit: objectFit,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTouchCallout: 'none',
    KhtmlUserSelect: 'none'
  };

  console.log('ProtectedImage - Final style object:', imageStyle);

  return (
    <div className={`${className} relative w-full h-full`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full select-none pointer-events-none"
        style={imageStyle as React.CSSProperties}
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