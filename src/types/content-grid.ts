// Grid-based content element types

export type ContentElementType = 'text' | 'image' | 'spacer';

export type GridColumnSpan = 'full' | 'half';

export interface ContentElement {
  id: string;
  type: ContentElementType;
  columnSpan: GridColumnSpan;
  order: number;
  content?: {
    // Text content
    text?: string;
    heading?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';

    // Image content
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;
    imageFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    imageAlignment?: 'left' | 'center' | 'right';

    // Spacer content
    height?: number; // in pixels
  };
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    borderRadius?: number;
    border?: {
      width?: number;
      style?: 'solid' | 'dashed' | 'dotted' | 'none';
      color?: string;
    };
  };
}

export interface ContentSection {
  id: string;
  title: string;
  elements: ContentElement[];
}

// Helper type for About section with grid elements
export interface AboutSettingsWithGrid {
  id: string;
  main_title: string;
  profile_photo_url?: string;
  // Legacy fields (for backward compatibility)
  intro_text?: string;
  description_text?: string;
  // New grid-based content
  content_elements: ContentElement[];
  // Keep other existing fields
  skills: string[];
  services: Array<{
    icon: string;
    title: string;
    description: string;
    url?: string;
  }>;
  stats: Array<{
    number: string;
    label: string;
  }>;
  quotes: Array<{
    text: string;
    author: string;
  }>;
}

// Helper type for custom sections with grid
export interface CustomSectionWithGrid {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  display_order: number;
  content_elements: ContentElement[];
  // Legacy content field for backward compatibility
  content?: string;
}

// Helper functions
export function createEmptyTextElement(): ContentElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    columnSpan: 'half',
    order: 0,
    content: {
      text: '',
      alignment: 'left',
      fontSize: 'normal',
      fontWeight: 'normal'
    },
    styling: {
      padding: { top: 16, right: 16, bottom: 16, left: 16 }
    }
  };
}

export function createEmptyImageElement(): ContentElement {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    columnSpan: 'half',
    order: 0,
    content: {
      imageUrl: '',
      imageAlt: '',
      imageFit: 'cover',
      imageAlignment: 'center'
    },
    styling: {
      padding: { top: 16, right: 16, bottom: 16, left: 16 }
    }
  };
}

export function createSpacerElement(height: number = 32): ContentElement {
  return {
    id: crypto.randomUUID(),
    type: 'spacer',
    columnSpan: 'full',
    order: 0,
    content: {
      height
    }
  };
}