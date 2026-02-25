import React, { useEffect, useRef, useState } from 'react';

interface WebcamViewerProps {
  className?: string;
  style?: React.CSSProperties;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
}

const WebcamViewer: React.FC<WebcamViewerProps> = ({
  className,
  style,
  onStreamReady,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentVideoRef = videoRef.current;

    const startWebcam = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        // Check if component is still mounted
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (currentVideoRef) {
          currentVideoRef.srcObject = stream;

          // Wait for video to be ready
          const playPromise = currentVideoRef.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (isMounted) {
                setIsStreamActive(true);
                setIsLoading(false);
                onStreamReady?.(stream);
              }
            }).catch((err) => {
              console.error('Error playing video:', err);
              if (isMounted) {
                setError('Unable to play video stream');
                setIsLoading(false);
                onError?.('Unable to play video stream');
              }
            });
          }
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unable to access camera';
          setError(`Camera access failed: ${errorMessage}`);
          setIsStreamActive(false);
          setIsLoading(false);
          onError?.(errorMessage);
        }
      }
    };

    startWebcam();

    // Cleanup function
    return () => {
      isMounted = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped camera track:', track.kind);
        });
        streamRef.current = null;
      }

      if (currentVideoRef) {
        currentVideoRef.srcObject = null;
      }

      setIsStreamActive(false);
      setIsLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Additional cleanup for page navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsStreamActive(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`} style={style}>
        <div className="text-center p-4">
          <div className="text-red-400 text-3xl mb-3">📷❌</div>
          <p className="text-red-300 text-sm font-medium">Camera Error</p>
          <p className="text-red-400 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black rounded-lg ${className}`} style={style}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{
          transform: 'scaleX(-1)', // Mirror effect
          backgroundColor: '#000'
        }}
      />

      {/* Loading overlay */}
      {(isLoading || !isStreamActive) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-300 text-sm font-medium">
              {isLoading ? 'Initializing camera...' : 'Starting video...'}
            </p>
          </div>
        </div>
      )}

      {/* Stream indicator */}
      {isStreamActive && (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">LIVE</span>
        </div>
      )}
    </div>
  );
};

export default WebcamViewer;
