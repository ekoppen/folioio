import { supabase } from '@/integrations/supabase/client';

export const translateAlbumDescriptions = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('translate-album-descriptions');
    
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