import { useState, useEffect } from 'react';

export const useImageBrightness = () => {
  const [isBackgroundLight, setIsBackgroundLight] = useState(false);

  useEffect(() => {
    const checkBrightness = () => {
      // Find the currently visible hero image
      const heroSection = document.getElementById('home');
      if (!heroSection) return;

      const visibleImageDiv = heroSection.querySelector('[class*="opacity-100"], [class*="translate-x-0"]');
      const img = visibleImageDiv?.querySelector('img');
      
      if (!img || !img.complete) {
        // If image isn't loaded yet, try again after a short delay
        setTimeout(checkBrightness, 500);
        return;
      }

      // Create a canvas to analyze the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // Sample only the center-top area where navigation text appears
        const sampleWidth = 300; // Width of navigation area
        const sampleHeight = 80;  // Height of navigation area
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        // Calculate the center horizontal position for sampling
        const centerX = (img.naturalWidth - sampleWidth) / 2;
        const topY = 0; // Top of the image where navigation appears

        // Draw only the center-top portion of the image
        ctx.drawImage(
          img, 
          centerX, topY, sampleWidth, sampleHeight, // Source rectangle (center-top of image)
          0, 0, sampleWidth, sampleHeight           // Destination rectangle (canvas)
        );
        
        // Get image data from the navigation area
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;

        let totalBrightness = 0;
        let pixelCount = 0;

        // Calculate average brightness of the navigation area
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate perceived brightness using luminance formula
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += brightness;
          pixelCount++;
        }

        const averageBrightness = totalBrightness / pixelCount;
        
        // If average brightness is above threshold, show background bar
        setIsBackgroundLight(averageBrightness > 160); // Lowered threshold for better detection
      } catch (error) {
        // Handle CORS errors or other image loading issues
        console.log('Could not analyze image brightness:', error);
        setIsBackgroundLight(false);
      }
    };

    // Check brightness initially and when images change
    const observer = new MutationObserver(() => {
      setTimeout(checkBrightness, 100);
    });

    const heroSection = document.getElementById('home');
    if (heroSection) {
      observer.observe(heroSection, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    // Initial check
    setTimeout(checkBrightness, 500);

    return () => {
      observer.disconnect();
    };
  }, []);

  return isBackgroundLight;
};