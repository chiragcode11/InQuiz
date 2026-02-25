import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { apiService } from '../services/api';
import WebcamViewer from './WebcamViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Mic, Speaker, PlayCircle, Settings, PhoneOff, AlertTriangle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Particles } from '@/components/motion/particles';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        break;
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(voice =>
        /female|woman|zira|cortana|siri/i.test(voice.name) && voice.lang.includes('en')
      );
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('en-US')) ||
        voices.find(voice => voice.lang.includes('en')) ||
        voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  };

  const speakUtterance = (utterance: SpeechSynthesisUtterance, resolve: () => void): void => {
    utterance.onstart = () => {
      setIsAISpeaking(true);
    };

    utterance.onend = () => {
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
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (interviewId && isInterviewStarted) apiService.completeVoiceInterview(interviewId).catch(console.error);

      if (isInterviewStarted && !isInterviewCompleted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the interview? Your progress will be lost.';
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (interviewId && isInterviewStarted) apiService.completeVoiceInterview(interviewId).catch(console.error);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        SpeechRecognition.stopListening();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (window.speechSynthesis) window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (interviewId && isInterviewStarted) apiService.completeVoiceInterview(interviewId).catch(console.error);
    };
  }, [interviewId, isInterviewStarted, isInterviewCompleted, navigate]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [conversation, transcript]);

  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (listening && transcript.trim() && !hasSubmittedResponse && !isProcessingResponse && transcript.split(' ').length >= 3) {
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim() && !hasSubmittedResponse && !isProcessingResponse) {
          submitResponse();
        }
      }, 4000);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening, hasSubmittedResponse, isProcessingResponse]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        SpeechRecognition.stopListening();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      SpeechRecognition.stopListening();
    };
  }, []);

  // Camera handlers
  const handleCameraStreamReady = (stream: MediaStream) => {
    setCameraError(null);
  };

  const handleCameraError = (error: string) => {
    setCameraError(error);
  };

  // Interview functions
  const requestPermissions = async () => {
    setIsRequestingPermissions(true);
    setPermissionError('');

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      micStream.getTracks().forEach(track => track.stop());
      cameraStream.getTracks().forEach(track => track.stop());

      setShowPermissionRequest(false);
      setShowCamera(true);

      setTimeout(() => {
        startInterview();
      }, 500);

    } catch (error) {
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
      const result = await apiService.startVoiceInterview(interviewId);
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
    if (!transcript.trim() || isProcessingResponse || hasSubmittedResponse) return;

    setIsProcessingResponse(true);
    setHasSubmittedResponse(true);
    setIsWaitingForNextQuestion(true);

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    SpeechRecognition.stopListening();

    const responseTime = Math.floor((Date.now() - responseStartTime) / 1000);

    try {
      const result = await apiService.submitVoiceResponse(interviewId, {
        response: transcript,
        response_time: responseTime
      });

      if (result.conversation) setConversation(result.conversation);

      if (result.has_follow_up && result.follow_up_question) {
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
        setIsInterviewCompleted(true);
        setIsWaitingForNextQuestion(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await speakText(result.completion_message || "Thank you for completing the interview. You will receive your feedback shortly.");

        setTimeout(() => {
          navigate('/feedback', { state: { interviewId }, replace: true });
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
    SpeechRecognition.stopListening();
    if (speechSynthesisRef.current) window.speechSynthesis.cancel();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try { await apiService.completeVoiceInterview(interviewId); } catch (e) { }
    navigate('/', { replace: true });
  };

  // Render browser unsupported
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 glass-card text-center relative z-10">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Browser Not Supported</h2>
          <p className="text-muted-foreground mb-8">
            Your browser doesn't support the required speech recognition. Please use Chrome, Edge, or Safari.
          </p>
          <Button size="lg" className="rounded-full w-full" onClick={() => navigate('/')}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  // Render permission screen
  if (showPermissionRequest) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-black">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
        <Card className="relative z-10 w-full max-w-5xl p-8 md:p-12 glass-card rounded-3xl border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-6 border-b border-white/10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Interview Assistant</h2>
              <p className="text-muted-foreground">Voice-powered interview practice</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/', { replace: true })} className="rounded-full">Cancel</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-8 text-center min-h-[250px] flex flex-col justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Camera and Mic Required</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Enable access to begin your AI interview session</p>
                {permissionError && (
                  <div className="mt-6 flex items-start gap-2 p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-left">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> {permissionError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Mic />, label: "Microphone" },
                  { icon: <Speaker />, label: "Speaker" },
                  { icon: <Video />, label: "Camera" }
                ].map((device, index) => (
                  <div key={index} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center">
                    <div className="text-muted-foreground mb-3 bg-white/5 p-3 rounded-full">{device.icon}</div>
                    <div className="text-sm text-white font-medium">{device.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-8">Ready to Start?</h3>
              <div className="space-y-4 flex-grow mb-10">
                {[
                  { text: "Take a deep breath and relax." },
                  { text: `Expect to spend about ${config?.duration_minutes || 20} minutes.` },
                  { text: "Find a quiet place with stable internet." }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="w-2 h-2 rounded-full bg-zinc-400 shrink-0"></div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={requestPermissions}
                  disabled={isRequestingPermissions}
                  className="w-full text-lg py-6 rounded-full bg-white text-black hover:bg-zinc-200 transition-all font-semibold"
                >
                  {isRequestingPermissions ? (
                    <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Requesting Access...</>
                  ) : 'Enable Access & Start Interview'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Your privacy is protected. Responses are not used to train AI models.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render Main Interview Room
  return (
    <div className="min-h-screen relative flex flex-col p-4 md:p-6 overflow-hidden bg-black">
      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center glass-panel rounded-2xl p-4 mb-6 sticky top-0 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
          <span className="font-mono text-lg font-bold text-white tracking-widest">
            {formatTime(elapsedTime)} <span className="text-muted-foreground font-normal">/ {formatTime((config?.duration_minutes || 20) * 60)}</span>
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" className="rounded-full glass hover:bg-white/10" title="Settings">
            <Settings className="w-4 h-4 text-white" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-destructive/20 border-destructive/50 hover:bg-destructive/40" title="End call" onClick={leaveInterview}>
            <PhoneOff className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

        {/* Video Area (Left Column) */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1 min-h-0">
          {/* AI Avatar block */}
          <Card className="glass-card border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center flex-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
            <div className={`relative mb-6 ${isAISpeaking ? 'animate-pulse-glow' : ''}`}>
              <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-black flex items-center justify-center relative z-10">
                <div className="text-5xl">🤖</div>
              </div>
              {isAISpeaking && (
                <div className="absolute inset-0 rounded-full bg-white/10 blur-xl scale-150 animate-pulse"></div>
              )}
            </div>
            <h4 className="text-xl font-bold text-white tracking-tight">AI Interviewer</h4>
            {isAISpeaking && (
              <div className="mt-3 flex items-center text-zinc-300 text-sm font-medium">
                <span className="flex h-3 w-3 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-300"></span>
                </span>
                Speaking...
              </div>
            )}
          </Card>

          {/* User Webcam block */}
          <Card className="glass-card border-white/10 rounded-3xl p-4 flex flex-col shrink-0 min-h-[220px]">
            <div className="w-full flex-1 bg-black/60 rounded-2xl overflow-hidden relative border border-white/5">
              {showCamera ? (
                <WebcamViewer
                  key="interview-camera"
                  className="w-full h-full object-cover"
                  onStreamReady={handleCameraStreamReady}
                  onError={handleCameraError}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm font-medium">Initializing feed...</span>
                </div>
              )}
              {cameraError && (
                <div className="absolute bottom-2 left-2 right-2 bg-destructive/90 text-white text-xs p-2 rounded-lg text-center backdrop-blur-md">
                  {cameraError}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chat Area (Right Column) */}
        <Card className="lg:col-span-8 flex flex-col glass-card border-white/10 rounded-3xl overflow-hidden order-1 lg:order-2 flex-1 min-h-0">
          <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-white" /> Live Transcript
            </h4>
            <div className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
              Q {questionIndex + 1} of {totalQuestions}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scrollbar min-h-0" ref={chatBoxRef}>
            {conversation.map((item, index) => (
              <div key={index} className={`flex ${item.type.startsWith('ai') ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg relative ${item.type.startsWith('ai')
                  ? 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                  : 'bg-white/20 text-white rounded-tr-none border border-white/10'
                  }`}>
                  <div className={`font-semibold text-xs mb-2 tracking-wide uppercase ${item.type.startsWith('ai') ? 'text-white/60' : 'text-white/80'}`}>
                    {item.type.startsWith('ai') ? 'AI Interviewer' : 'You'}
                  </div>
                  <div className="text-[15px] leading-relaxed">{item.text}</div>
                  <div className={`text-[10px] opacity-50 mt-2 text-right ${item.type.startsWith('ai') ? '' : 'text-white/70'}`}>
                    {new Date(item.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {transcript && !hasSubmittedResponse && (
              <div className="flex justify-end animate-fade-in">
                <div className="max-w-[85%] p-4 rounded-2xl bg-white/20 border border-white/30 text-white rounded-tr-none shadow-lg shadow-white/5">
                  <div className="flex items-center font-semibold text-xs mb-2 tracking-wide text-white/80">
                    <span className="flex h-2 w-2 relative mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    You (Speaking...)
                  </div>
                  <div className="text-[15px] leading-relaxed italic opacity-90">{transcript}</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-black/40 border-t border-white/10 shrink-0 min-h-[85px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {listening && !hasSubmittedResponse && !isAISpeaking && (
                <div className="flex items-center text-white font-medium text-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                  Listening...
                </div>
              )}
              {isProcessingResponse && (
                <div className="flex items-center text-zinc-300 font-medium text-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                </div>
              )}
              {isWaitingForNextQuestion && !isProcessingResponse && (
                <div className="flex items-center text-white font-medium text-sm bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce mr-2"></div> Next question
                </div>
              )}
            </div>

            {transcript && !listening && !hasSubmittedResponse && !isProcessingResponse && !isAISpeaking && (
              <Button onClick={submitResponse} size="default" className="rounded-full bg-white text-black hover:bg-zinc-200">
                Send <PlayCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default InterviewRoom;
