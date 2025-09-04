import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { apiService } from '../services/api';
import WebcamViewer from './WebcamViewer';

interface ConversationItem {
  type: 'ai_question' | 'user_response' | 'ai_follow_up' | 'ai_completion' | 'ai_repeat' | 'ai_clarification' | 'ai_response' | 'ai_transition';
  text: string;
  timestamp: number;
  question_id?: string;
}

const InterviewRoom: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId, config } = location.state || {};

  // Core interview state
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  // Speech and timing state
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);

  // Permission and camera state
  const [showPermissionRequest, setShowPermissionRequest] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Processing state
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [hasSubmittedResponse, setHasSubmittedResponse] = useState(false);
  const [isWaitingForNextQuestion, setIsWaitingForNextQuestion] = useState(false);

  // Refs
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Voice synthesis functions
  const setOptimalFemaleVoice = (utterance: SpeechSynthesisUtterance): void => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

    const preferredVoices = [
      'Google US English Female',
      'Microsoft Zira Desktop - English (United States)',
      'Samantha',
      'Victoria',
      'Karen',
      'Moira',
      'Tessa',
      'Ava',
      'Allison'
    ];

    let selectedVoice = null;

    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => voice.name === voiceName);
      if (selectedVoice) {
        console.log('Selected voice (exact match):', selectedVoice.name);
        break;
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(voice =>
        /female|woman|zira|cortana|siri/i.test(voice.name) && voice.lang.includes('en')
      );
      if (selectedVoice) {
        console.log('Selected voice (pattern match):', selectedVoice.name);
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('en-US')) ||
        voices.find(voice => voice.lang.includes('en')) ||
        voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Final selected voice:', selectedVoice.name, selectedVoice.lang);
    }
  };

  const speakUtterance = (utterance: SpeechSynthesisUtterance, resolve: () => void): void => {
    utterance.onstart = () => {
      console.log('AI started speaking');
      setIsAISpeaking(true);
    };

    utterance.onend = () => {
      console.log('AI finished speaking');
      setIsAISpeaking(false);
      resolve();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsAISpeaking(false);
      resolve();
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        utterance.volume = 1;

        if (window.speechSynthesis.getVoices().length > 0) {
          setOptimalFemaleVoice(utterance);
          speakUtterance(utterance, resolve);
        } else {
          const handleVoicesChanged = () => {
            setOptimalFemaleVoice(utterance);
            speakUtterance(utterance, resolve);
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          };

          window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
          window.speechSynthesis.getVoices();
        }
      } else {
        resolve();
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!interviewId) {
      navigate('/setup');
      return;
    }

    const interval = setInterval(() => {
      if (interviewStartTime > 0) {
        setElapsedTime(Math.floor((Date.now() - interviewStartTime) / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [interviewId, navigate, interviewStartTime]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Stop all media streams
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      SpeechRecognition.stopListening();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (interviewId && isInterviewStarted) {
        apiService.completeVoiceInterview(interviewId).catch(console.error);
      }

      if (isInterviewStarted && !isInterviewCompleted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the interview? Your progress will be lost.';
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      console.log('Browser back button pressed - cleaning up camera');

      // Stop all activities immediately
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      SpeechRecognition.stopListening();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (interviewId && isInterviewStarted) {
        apiService.completeVoiceInterview(interviewId).catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - stopping activities');
        SpeechRecognition.stopListening();
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Final cleanup
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      SpeechRecognition.stopListening();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (interviewId && isInterviewStarted) {
        apiService.completeVoiceInterview(interviewId).catch(console.error);
      }
    };
  }, [interviewId, isInterviewStarted, isInterviewCompleted, navigate]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    if (listening && transcript.trim() && !hasSubmittedResponse && !isProcessingResponse && transcript.split(' ').length >= 3) {
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim() && !hasSubmittedResponse && !isProcessingResponse) {
          console.log('Auto-submitting response after silence');
          submitResponse();
        }
      }, 4000);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [transcript, listening, hasSubmittedResponse, isProcessingResponse]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - stopping speech recognition');
        SpeechRecognition.stopListening();
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      SpeechRecognition.stopListening();
    };
  }, []);

  useEffect(() => {
    return () => {
      console.log('InterviewRoom component unmounting - stopping speech recognition');
      SpeechRecognition.stopListening();
    };
  }, []);

  // Camera handlers
  const handleCameraStreamReady = (stream: MediaStream) => {
    console.log('Camera stream ready:', stream);
    setCameraError(null);
  };

  const handleCameraError = (error: string) => {
    console.error('Camera error:', error);
    setCameraError(error);
  };

  // Interview functions
  const requestPermissions = async () => {
    setIsRequestingPermissions(true);
    setPermissionError('');

    try {
      console.log('Requesting permissions...');

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      console.log('Permissions granted successfully');

      micStream.getTracks().forEach(track => track.stop());
      cameraStream.getTracks().forEach(track => track.stop());

      setHasPermissions(true);
      setShowPermissionRequest(false);
      setShowCamera(true);

      setTimeout(() => {
        startInterview();
      }, 500);

    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionError('Camera and microphone access are required for the AI interview. Please enable them in your browser settings and try again.');
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = async () => {
    try {
      console.log('Starting interview...');

      const result = await apiService.startVoiceInterview(interviewId);
      console.log('Interview start result:', result);

      setCurrentQuestion(result.current_question.question_text);
      setQuestionIndex(result.question_index);
      setTotalQuestions(result.total_questions);
      setIsInterviewStarted(true);
      setInterviewStartTime(Date.now());

      const welcomeMessage = "Welcome to your AI interview. I will ask you a series of questions. Please speak clearly and take your time with each answer. Let's begin with the first question.";
      await speakText(welcomeMessage);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await speakText(result.current_question.question_text);

      setResponseStartTime(Date.now());
      setHasSubmittedResponse(false);

      setTimeout(() => {
        if (!hasSubmittedResponse) {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        }
      }, 500);

    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const submitResponse = async () => {
    if (!transcript.trim() || isProcessingResponse || hasSubmittedResponse) {
      console.log('Cannot submit:', {
        hasTranscript: !!transcript.trim(),
        isProcessing: isProcessingResponse,
        hasSubmitted: hasSubmittedResponse
      });
      return;
    }

    console.log('Submitting response:', transcript);
    setIsProcessingResponse(true);
    setHasSubmittedResponse(true);
    setIsWaitingForNextQuestion(true);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    SpeechRecognition.stopListening();
    const responseTime = Math.floor((Date.now() - responseStartTime) / 1000);

    try {
      const result = await apiService.submitVoiceResponse(interviewId, {
        response: transcript,
        response_time: responseTime
      });

      console.log('Voice response result:', result);

      if (result.conversation) {
        setConversation(result.conversation);
      }

      if (result.has_follow_up && result.follow_up_question) {
        console.log('Processing follow-up question');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await speakText(result.follow_up_question);

        setCurrentQuestion(result.follow_up_question);
        setResponseStartTime(Date.now());
        resetTranscript();
        setHasSubmittedResponse(false);
        setIsWaitingForNextQuestion(false);

        setTimeout(() => {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        }, 500);

      } else if (result.next_question) {
        console.log('Processing next question');
        setCurrentQuestion(result.next_question.question_text);
        setQuestionIndex(result.question_index);

        await new Promise(resolve => setTimeout(resolve, 1000));
        if (result.transition_message) {
          await speakText(result.transition_message);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await speakText(result.next_question.question_text);

        setResponseStartTime(Date.now());
        resetTranscript();
        setHasSubmittedResponse(false);
        setIsWaitingForNextQuestion(false);

        setTimeout(() => {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        }, 500);

      } else if (result.interview_completed) {
        console.log('Interview completed');
        setIsInterviewCompleted(true);
        setIsWaitingForNextQuestion(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await speakText(result.completion_message || "Thank you for completing the interview. You will receive your feedback shortly.");

        setTimeout(() => {
          navigate('/feedback', {
            state: { interviewId },
            replace: true
          });
        }, 4000);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setHasSubmittedResponse(false);
      setIsWaitingForNextQuestion(false);

      setTimeout(() => {
        if (!hasSubmittedResponse) {
          SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        }
      }, 1000);
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const leaveInterview = async () => {
    console.log('Leaving interview');

    SpeechRecognition.stopListening();

    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    try {
      await apiService.completeVoiceInterview(interviewId);
    } catch (error) {
      console.error('Error leaving interview:', error);
    }

    navigate('/', { replace: true });
  };

  // Render conditions
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Browser Not Supported</h2>
          <p className="text-gray-400 mb-6">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (showPermissionRequest) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-screen">
          <div className="w-full bg-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  AI Interview Assistant
                </h2>
                <p className="text-gray-400">Voice-powered interview practice</p>
              </div>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
              >
                Back to Home
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-2xl p-6 md:p-8 text-center min-h-[300px] flex flex-col justify-center">
                  <div className="text-4xl md:text-5xl text-orange-400 mb-4">📹</div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3">
                    Camera and Microphone Required
                  </h3>
                  <p className="text-sm md:text-base text-gray-400 max-w-sm mx-auto">
                    Enable access to begin your AI interview session
                  </p>
                  {permissionError && (
                    <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{permissionError}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "🎤", label: "Microphone", status: "Required" },
                    { icon: "🔊", label: "Speaker", status: "Ready" },
                    { icon: "📹", label: "Camera", status: "Required" }
                  ].map((device, index) => (
                    <div key={index} className="bg-gray-700 rounded-xl p-3 text-center">
                      <div className="text-xl md:text-2xl mb-1">{device.icon}</div>
                      <div className="text-xs md:text-sm text-gray-300 font-medium">{device.label}</div>
                      <div className="text-xs text-gray-500">{device.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 rounded-2xl p-6 md:p-8 flex flex-col">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">
                  Get Ready for Your Interview
                </h3>

                <div className="space-y-4 mb-8 flex-grow">
                  {[
                    { icon: "📅", text: "Start now or come back later" },
                    { icon: "⏱️", text: `Expect to spend ${config?.duration_minutes || 20} minutes` },
                    { icon: "⚙️", text: "Check your device settings" },
                    { icon: "🔇", text: "Find a quiet place with stable internet" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center bg-gray-600 rounded-lg p-3">
                      <span className="text-lg md:text-xl mr-3 flex-shrink-0">{item.icon}</span>
                      <span className="text-sm md:text-base text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={requestPermissions}
                    disabled={isRequestingPermissions}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold text-base md:text-lg py-3 md:py-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isRequestingPermissions ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Requesting Permissions...
                      </div>
                    ) : (
                      'Enable Permissions & Start Interview'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center max-w-sm mx-auto">
                    Your responses are used only for assessment and are never used to train AI models.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800 rounded-2xl p-3 md:p-4 mb-4">
          <div className="text-base md:text-lg font-semibold text-orange-400 mb-2 sm:mb-0">
            {formatTime(elapsedTime)} / {formatTime((config?.duration_minutes || 20) * 60)}
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors text-sm md:text-base"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={leaveInterview}
              className="w-8 h-8 md:w-10 md:h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors text-sm md:text-base"
              title="End Interview"
            >
              📞
            </button>
            <button
              className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors text-sm md:text-base"
              title="Report Issue"
            >
              ⚠️
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 min-h-0">

          {/* Video Area */}
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center order-2 lg:order-1">
            {/* AI Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 relative mb-4">
              <div className={`w-full h-full rounded-full bg-gray-700 border-4 border-orange-500 flex items-center justify-center transition-all duration-300 ${isAISpeaking ? 'shadow-lg shadow-orange-500/50 scale-105' : ''}`}>
                <span className="text-xl sm:text-2xl lg:text-3xl">🤖</span>
              </div>
              {isAISpeaking && (
                <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-pulse"></div>
              )}
            </div>
            <h4 className="text-base md:text-lg font-semibold text-white mb-3">AI Interviewer</h4>

            <div className="w-full flex-1 min-h-[120px] max-h-[200px] lg:max-h-[250px] bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
              {showCamera ? (
                <WebcamViewer
                  key="interview-camera" 
                  className="w-full h-full"
                  style={{ minHeight: '120px' }}
                  onStreamReady={handleCameraStreamReady}
                  onError={handleCameraError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl text-gray-500 mb-2">📹</div>
                    <span className="text-gray-500 text-sm">Camera initializing...</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {cameraError ? `Camera Error: ${cameraError}` : 'Your live video feed'}
            </p>
          </div>

          {/* Chat Area */}
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 flex flex-col min-h-0 order-1 lg:order-2">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3 md:pb-4 mb-3 md:mb-4">
              <h4 className="text-base md:text-xl font-semibold text-white">Interview Transcript</h4>
              <div className="text-xs md:text-sm text-gray-400">
                Question {questionIndex + 1} of {totalQuestions}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 mb-3 md:mb-4 min-h-0" ref={chatBoxRef}>
              {conversation.map((item, index) => (
                <div key={index} className={`flex ${item.type.startsWith('ai') ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[90%] sm:max-w-[85%] p-3 md:p-4 rounded-2xl ${item.type.startsWith('ai')
                      ? 'bg-gray-700 text-gray-300 rounded-bl-none'
                      : 'bg-orange-600 text-white rounded-br-none'
                    }`}>
                    <div className="font-semibold text-xs md:text-sm mb-1">
                      {item.type.startsWith('ai') ? 'AI Interviewer' : 'You'}
                    </div>
                    <div className="text-sm md:text-base">{item.text}</div>
                    <div className="text-xs opacity-60 mt-1 text-right">
                      {new Date(item.timestamp * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {transcript && !hasSubmittedResponse && (
                <div className="flex justify-end">
                  <div className="max-w-[90%] sm:max-w-[85%] p-3 md:p-4 rounded-2xl bg-orange-600 text-white rounded-br-none animate-pulse">
                    <div className="font-semibold text-xs md:text-sm mb-1">You (speaking...)</div>
                    <div className="text-sm md:text-base">{transcript}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="border-t border-gray-700 pt-3 md:pt-4">
              <div className="flex items-center justify-center min-h-[32px] md:min-h-[40px]">
                {isAISpeaking && (
                  <div className="flex items-center text-orange-400 font-medium text-sm md:text-base">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-orange-500 rounded-full animate-pulse mr-2"></div>
                    <span>AI is speaking...</span>
                  </div>
                )}

                {listening && !hasSubmittedResponse && !isAISpeaking && (
                  <div className="flex items-center text-green-400 font-medium text-sm md:text-base">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span>Listening to your response...</span>
                  </div>
                )}

                {isProcessingResponse && (
                  <div className="flex items-center text-blue-400 font-medium text-sm md:text-base">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Processing your response...</span>
                  </div>
                )}

                {isWaitingForNextQuestion && !isProcessingResponse && (
                  <div className="flex items-center text-purple-400 font-medium text-sm md:text-base">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full animate-bounce mr-2"></div>
                    <span>Preparing next question...</span>
                  </div>
                )}

                {transcript && !listening && !hasSubmittedResponse && !isProcessingResponse && !isAISpeaking && (
                  <button
                    onClick={submitResponse}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 md:px-6 rounded-full transition-colors text-sm md:text-base"
                  >
                    Submit Response
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
