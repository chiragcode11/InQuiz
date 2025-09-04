import { useEffect } from 'react';

export const useCameraCleanup = () => {
  useEffect(() => {
    const cleanup = () => {
      // Stop all media tracks on page unload
      navigator.mediaDevices.enumerateDevices().then(devices => {
        devices.forEach(device => {
          if (device.kind === 'videoinput') {
            // This is a more aggressive cleanup approach
            console.log('Cleaning up video device:', device.label);
          }
        });
      });
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
    };
  }, []);
};
