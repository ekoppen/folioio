import { getBackendAdapter } from '@/config/backend-config';

export const translateAlbumDescriptions = async () => {
  try {
    const backend = getBackendAdapter();
    const { data, error } = await backend.functions.invoke('translate-album-descriptions');
    
    if (error) {
      console.error('Error calling translation function:', error);
      return false;
    }
    
    console.log('Album translations result:', data);
    return true;
  } catch (error) {
    console.error('Error translating album descriptions:', error);
    return false;
  }
};