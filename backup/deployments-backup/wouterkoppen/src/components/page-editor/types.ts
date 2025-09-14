export type Unit = 'px' | '%' | 'vw' | 'vh' | 'em' | 'rem';

export interface DimensionValue {
  value: number;
  unit: Unit;
}

export interface ElementPosition {
  x: DimensionValue;
  y: DimensionValue;
}

export interface ElementSize {
  width: DimensionValue;
  height: DimensionValue;
}

export interface ElementAlignment {
  horizontal: 'left' | 'center' | 'right' | 'stretch';
  vertical: 'top' | 'center' | 'bottom' | 'stretch';
}

export interface ElementLayout {
  positioning: 'absolute' | 'relative' | 'flex';
  alignment?: ElementAlignment;
  margin?: {
    top?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
  };
  padding?: {
    top?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
  };
}

export interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: number;
  border?: string;
  padding?: number;
  margin?: number;
}

export interface PageElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'container' | 'heading' | 'video' | 'form' | 'map' | 'social' | 'divider' | 'spacer' | 'icon' | 'slideshow' | 'hero' | 'portfolio-gallery';
  position: ElementPosition;
  size: ElementSize;
  layout?: ElementLayout;
  style: ElementStyle;
  content: string;
  children?: string[];
  parent?: string;
  settings?: {
    // Slideshow settings
    slideshowAlbum?: string;
    autoAdvance?: boolean;
    transitionDuration?: number;
    transitionEffect?: 'fade' | 'slide' | 'scale';
    showNavigation?: boolean;
    showIndicators?: boolean;
    overlay?: boolean;
    overlayOpacity?: number;
    // Hero settings  
    siteTitle?: string;
    siteTagline?: string;
    showButtons?: boolean;
    // Portfolio settings
    showAllCategories?: boolean;
    gridColumns?: number;
  };
  breakpointStyles?: {
    mobile?: ElementStyle;
    tablet?: ElementStyle;
    desktop?: ElementStyle;
  };
}

export interface DragItem {
  type: string;
  elementType: PageElement['type'];
  id?: string;
}

export interface DropResult {
  position: ElementPosition;
}