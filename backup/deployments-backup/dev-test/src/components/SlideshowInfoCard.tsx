import React from 'react';

interface SlideshowInfoCardProps {
  title?: string;
  description?: string;
  enabled: boolean;
  position: string;
  radius: number;
  opacity: number;
  backgroundColor: string;
  backgroundOpacity?: number;
  marginLeft?: number;
  textSize?: number;
  contentFontFamily?: string;
}

const SlideshowInfoCard: React.FC<SlideshowInfoCardProps> = ({
  title,
  description,
  enabled,
  position,
  radius,
  opacity,
  backgroundColor,
  backgroundOpacity = 0.8,
  marginLeft = 0,
  textSize = 14,
  contentFontFamily = 'inherit'
}) => {
  if (!enabled || (!title && !description)) {
    return null;
  }

  const positionClasses = {
    'bottom-left': 'bottom-20 left-6',
    'bottom-right': 'bottom-20 right-6', 
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6'
  };

  return (
    <div
      className={`absolute z-20 max-w-md backdrop-blur-sm transition-all duration-300 ${positionClasses[position as keyof typeof positionClasses] || 'bottom-20 left-6'}`}
      style={{
        backgroundColor: `rgba(${parseInt(backgroundColor.slice(1, 3), 16)}, ${parseInt(backgroundColor.slice(3, 5), 16)}, ${parseInt(backgroundColor.slice(5, 7), 16)}, ${backgroundOpacity})`,
        borderRadius: `${radius}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      <div className="p-4">
        {title && (
          <h3 
            className="text-white font-bold mb-2 leading-tight" 
            style={{ 
              fontSize: `${textSize + 2}px`,
              fontFamily: contentFontFamily
            }}
          >
            {title}
          </h3>
        )}
        {description && (
          <p 
            className="text-white/90 leading-relaxed font-normal" 
            style={{ 
              fontSize: `${textSize - 1}px`,
              fontFamily: contentFontFamily
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SlideshowInfoCard;