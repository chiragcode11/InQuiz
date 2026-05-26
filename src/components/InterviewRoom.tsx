import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Conversation } from '@elevenlabs/client';
import { apiService } from '../services/api';
import WebcamViewer from './WebcamViewer';
import { Button } from '@/components/ui/button';
import { Video, Mic, Speaker, Settings, PhoneOff, AlertTriangle, AlertCircle, Loader2, FileText, ChevronDown } from 'lucide-react';
import { Particles } from '@/components/motion/particles';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

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
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  // Voice/Audio state
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const [statusText, setStatusText] = useState('Initializing agent...');

  // Permission and camera state
  const [showPermissionRequest, setShowPermissionRequest] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Refs
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<any>(null);
  const aiVisualizerRef = useRef<HTMLDivElement>(null);
  const aiRing1Ref = useRef<HTMLDivElement>(null);
  const aiRing2Ref = useRef<HTMLDivElement>(null);
  const aiBarsRef = useRef<HTMLDivElement>(null);
  const webcamWrapperRef = useRef<HTMLDivElement>(null);
  const interviewRef = useRef<any>(null);
  const currentQuestionIndexRef = useRef<number>(0);

  // Prevent back navigation during active interview
  useEffect(() => {
    if (showPermissionRequest) return;
    
    // Push dummy state to stack
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowEndConfirmation(true);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showPermissionRequest]);

  // Warn before browser refresh or leaving
  useEffect(() => {
    if (showPermissionRequest || isInterviewCompleted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to exit the interview? Your progress will be saved but the current session will terminate.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showPermissionRequest, isInterviewCompleted]);

  // Time elapsed interval
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
    };
  }, [interviewId, navigate, interviewStartTime]);

  // Clean up on unmount or page change
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error);
      }
    };
  }, []);

  // Poll database to sync active question index and completion state
  useEffect(() => {
    if (!isInterviewStarted || isInterviewCompleted) return;

    const pollInterval = setInterval(async () => {
      try {
        const interview = await apiService.getInterview(interviewId);
        setTotalQuestions(interview.questions.length);
        setQuestionIndex(interview.responses.length);
        
        if (interview.status === 'completed') {
          setIsInterviewCompleted(true);
          setStatusText("Interview completed! Generating feedback...");
          clearInterval(pollInterval);
          
          // Wait 6 seconds to let the voice finish speaking the completion greeting, then redirect
          setTimeout(async () => {
            if (conversationRef.current) {
              await conversationRef.current.endSession();
            }
            navigate('/feedback', { state: { interviewId }, replace: true });
          }, 6000);
        }
      } catch (e) {
        console.error("Error polling interview state:", e);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isInterviewStarted, isInterviewCompleted, interviewId, navigate]);

  // ElevenLabs real-time audio volume visualization loop
  useEffect(() => {
    let animationId: number;
    
    const updateAudioLevels = () => {
      if (conversationRef.current) {
        const inputVol = conversationRef.current.getInputVolume() || 0;
        const outputVol = conversationRef.current.getOutputVolume() || 0;
        
        // 1. Animate AI Visualizer Orb
        if (aiVisualizerRef.current) {
          const scale = 1 + outputVol * 0.15;
          aiVisualizerRef.current.style.transform = `scale(${scale})`;
          aiVisualizerRef.current.style.borderColor = `rgba(255, 255, 255, ${0.1 + outputVol * 0.4})`;
          aiVisualizerRef.current.style.boxShadow = outputVol > 0.01 
            ? `0 0 ${15 + outputVol * 35}px rgba(255, 255, 255, ${outputVol * 0.35})`
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        }
        
        // 2. Animate AI Waveform Bars
        if (aiBarsRef.current) {
          const barElements = aiBarsRef.current.children;
          for (let i = 0; i < barElements.length; i++) {
            const bar = barElements[i] as HTMLDivElement;
            const factor = Math.sin(Date.now() * 0.015 + i * 1.5) * 0.3 + 0.7;
            const height = 8 + (outputVol * 32 * factor);
            bar.style.height = `${height}px`;
            bar.style.opacity = `${0.4 + outputVol * 0.6}`;
          }
        }
        
        // 3. Animate AI Ambient Rings
        if (aiRing1Ref.current) {
          const scale = 1.15 + outputVol * 0.25;
          aiRing1Ref.current.style.transform = `scale(${scale})`;
          aiRing1Ref.current.style.opacity = outputVol > 0.01 ? `${0.03 + outputVol * 0.12}` : '0';
        }
        if (aiRing2Ref.current) {
          const scale = 1.35 + outputVol * 0.45;
          aiRing2Ref.current.style.transform = `scale(${scale})`;
          aiRing2Ref.current.style.opacity = outputVol > 0.01 ? `${0.015 + outputVol * 0.06}` : '0';
        }
        
        // 4. Animate User Webcam Border (Glow on voice)
        if (webcamWrapperRef.current) {
          webcamWrapperRef.current.style.boxShadow = inputVol > 0.02
            ? `0 0 ${15 + inputVol * 45}px rgba(255, 255, 255, ${inputVol * 0.25})`
            : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
          webcamWrapperRef.current.style.borderColor = inputVol > 0.02
            ? `rgba(255, 255, 255, ${0.1 + inputVol * 0.5})`
            : 'rgba(255, 255, 255, 0.05)';
        }

        // 5. User dynamic mic indicator
        const userMicVol = document.getElementById('user-mic-vol');
        if (userMicVol) {
          userMicVol.style.transform = `scale(${1 + inputVol * 0.5})`;
        }
      }
      
      animationId = requestAnimationFrame(updateAudioLevels);
    };
    
    if (isInterviewStarted) {
      animationId = requestAnimationFrame(updateAudioLevels);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isInterviewStarted]);

  // Scroll to bottom of chat transcripts
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [conversation]);

  // Camera handlers
  const handleCameraStreamReady = (stream: MediaStream) => {
    setCameraError(null);
  };

  const handleCameraError = (error: string) => {
    setCameraError(error);
  };

  // Permission request handler
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

  // Start ElevenLabs Conversational Session
  const startInterview = async () => {
    try {
      setStatusText('Connecting to voice server...');
      
      let interview = interviewRef.current;
      if (!interview) {
        interview = await apiService.getInterview(interviewId);
        interviewRef.current = interview;
      }
      
      const initialIndex = interview.responses.length;
      currentQuestionIndexRef.current = initialIndex;
      
      setTotalQuestions(interview.questions.length);
      setQuestionIndex(initialIndex);

      if (initialIndex >= interview.questions.length || interview.status === 'completed') {
        setIsInterviewCompleted(true);
        setStatusText("Interview already completed!");
        navigate('/feedback', { state: { interviewId }, replace: true });
        return;
      }

      const firstQuestionText = interview.questions[initialIndex]?.question_text || '';
      const firstMessage = `Hello! Welcome to your interview. Let's begin. Here is your first question: ${firstQuestionText}`;

      // Fetch signed WebSocket url from backend
      const response = await apiService.getElevenLabsSignedUrl();
      const signedUrl = response.signed_url;

      if (!signedUrl) {
        throw new Error('Failed to retrieve signed URL');
      }

      // Initialize ElevenLabs Conversational Session
      const conversation = await Conversation.startSession({
        signedUrl: signedUrl,
        overrides: {
          agent: {
            firstMessage: firstMessage
          }
        },
        clientTools: {
          get_next_question: async () => {
            try {
              const currentIdx = currentQuestionIndexRef.current;
              const interviewData = interviewRef.current;
              if (interviewData && currentIdx < interviewData.questions.length) {
                return interviewData.questions[currentIdx].question_text;
              }
              return "INTERVIEW_COMPLETED";
            } catch (error) {
              console.error("Error in get_next_question tool:", error);
              return "Error retrieving question.";
            }
          },
          submit_candidate_response: async ({ response_text }: { response_text: string }) => {
            try {
              const currentIdx = currentQuestionIndexRef.current;
              const interviewData = interviewRef.current;
              if (interviewData && currentIdx < interviewData.questions.length) {
                const currentQuestion = interviewData.questions[currentIdx];
                await apiService.submitResponse(interviewId!, {
                  question_id: currentQuestion.id,
                  question_text: currentQuestion.question_text,
                  user_response: response_text,
                  response_time: 0,
                  timestamp: new Date().toISOString()
                });
                
                // Increment current question index local tracker
                currentQuestionIndexRef.current = currentIdx + 1;
                return "Response saved successfully.";
              }
              return "No active question to save.";
            } catch (error) {
              console.error("Error in submit_candidate_response tool:", error);
              return "Error saving response.";
            }
          },
          complete_interview: async () => {
            try {
              await apiService.completeInterview(interviewId!);
              return "Interview completed.";
            } catch (error) {
              console.error("Error in complete_interview tool:", error);
              return "Error completing interview.";
            }
          }
        },
        onConnect: () => {
          console.log('ElevenLabs Connected');
          setIsInterviewStarted(true);
          setInterviewStartTime(Date.now());
          setStatusText('Interview active');
          
          // Seed the transcription list with the initial greeting
          setConversation([
            {
              type: 'ai_question',
              text: firstMessage,
              timestamp: Date.now() / 1000
            }
          ]);
        },
        onDisconnect: (details: any) => {
          console.log('ElevenLabs Disconnected:', details);
          setIsInterviewStarted(false);
          
          let disconnectReason = 'Disconnected';
          if (details?.reason === 'error') {
            disconnectReason = `Error: ${details.message || 'Unknown socket error'}`;
          } else if (details?.reason === 'agent') {
            disconnectReason = 'Session ended by agent';
          } else if (details?.reason === 'user') {
            disconnectReason = 'Disconnected';
          }
          setStatusText(disconnectReason);
        },
        onMessage: (message) => {
          if (message.message?.trim()) {
            setConversation((prev) => {
              // Avoid duplicates
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.text === message.message && lastMsg.type === (message.source === 'user' ? 'user_response' : 'ai_question')) {
                return prev;
              }
              return [
                ...prev,
                {
                  type: message.source === 'user' ? 'user_response' : 'ai_question',
                  text: message.message,
                  timestamp: Date.now() / 1000
                }
              ];
            });
          }
        },
        onModeChange: (mode) => {
          setIsAISpeaking(mode.mode === 'speaking');
        },
        onError: (err: string, context?: any) => {
          console.error('ElevenLabs Error:', err, context);
          setStatusText(`Error: ${err}`);
        }
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error('Error starting voice session:', error);
      setStatusText('Connection failed');
    }
  };

  const handleReconnect = () => {
    if (interviewId) {
      startInterview();
    }
  };

  const confirmEndInterviewEarly = async () => {
    setShowEndConfirmation(false);
    setStatusText("Ending session...");
    
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.error(e);
      }
    }
    
    try {
      await apiService.completeInterview(interviewId);
    } catch (e) {
      console.error(e);
    }
    
    navigate('/feedback', { state: { interviewId }, replace: true });
  };

  const handleSendQuickMessage = async (text: string) => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.sendUserMessage(text);
      } catch (e) {
        console.error("Failed to send quick message:", e);
      }
    }
  };

  const leaveInterview = async () => {
    setShowEndConfirmation(true);
  };

  // Permission UI
  if (showPermissionRequest) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 py-20 bg-black text-white selection:bg-white/20 font-sans">
        <Particles
          className="absolute inset-0 z-0"
          quantity={60}
          ease={80}
          color="#ffffff"
          refresh
        />

        <div className="relative z-10 w-full max-w-3xl flex flex-col space-y-8 transition-all duration-1000">
          
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-white opacity-80 animate-pulse"></span>
              <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">AI Interview Room</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-1 leading-tight">
              Prepare Your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Interview Environment</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-md mt-2 leading-relaxed">
              Enable camera and microphone access below to start your personalized voice-powered session.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-white/5 bg-white/[0.01] rounded-[2rem] relative overflow-hidden backdrop-blur-md min-h-[200px]">
                <div className="bg-white/5 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Hardware Permissions</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">We require hardware access to capture your response transcriptions and stream the camera feed.</p>
                
                {permissionError && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {permissionError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Mic className="w-3.5 h-3.5" />, label: "Mic" },
                  { icon: <Speaker className="w-3.5 h-3.5" />, label: "Audio" },
                  { icon: <Video className="w-3.5 h-3.5" />, label: "Camera" }
                ].map((device, index) => (
                  <div key={index} className="bg-white/[0.01] border border-white/5 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm">
                    <div className="text-zinc-400 mb-1.5 bg-white/5 p-2 rounded-full">{device.icon}</div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">{device.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between h-full space-y-6">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 text-center md:text-left">Before you begin</h3>
                <div className="space-y-3">
                  {[
                    { text: "Find a quiet space with minimal background noise." },
                    { text: `Expect to spend about ${config?.duration_minutes || 20} minutes on the interview.` },
                    { text: "Ensure your internet connection is stable and responsive." }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 bg-white/[0.01] border border-white/5 rounded-2xl p-3.5 backdrop-blur-sm">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-500 shrink-0 mt-1.5"></span>
                      <span className="text-xs text-zinc-400 leading-normal">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={requestPermissions}
                  disabled={isRequestingPermissions}
                  className="w-full rounded-full py-6 text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all gap-2 group shadow-[0_4px_25px_rgba(255,255,255,0.08)] hover:shadow-[0_4px_35px_rgba(255,255,255,0.2)]"
                >
                  {isRequestingPermissions ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin text-black" /> Requesting Access...</>
                  ) : 'Enable Access & Start Interview'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/', { replace: true })}
                  className="w-full text-zinc-500 hover:text-white rounded-full py-2 text-xs font-semibold hover:bg-white/[0.02]"
                  disabled={isRequestingPermissions}
                >
                  Cancel and Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen relative flex flex-col p-4 md:p-6 lg:overflow-hidden bg-black text-white selection:bg-white/20 font-sans">
      <Particles
        className="absolute inset-0 z-0"
        quantity={60}
        ease={80}
        color="#ffffff"
        refresh
      />

      {/* Floating Pill Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex justify-between items-center px-6 py-4 mb-6 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mt-2 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isInterviewStarted ? "bg-emerald-500" : "bg-zinc-500"
            )}></span>
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              isInterviewStarted ? "bg-emerald-500" : "bg-zinc-500"
            )}></span>
          </span>
          <span className="font-mono text-xs md:text-sm font-bold text-zinc-100 tracking-wider">
            {formatTime(elapsedTime)} <span className="text-zinc-500 font-normal">/ {formatTime((config?.duration_minutes || 20) * 60)}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-inner">
            <span className={cn(
              "flex h-1.5 w-1.5 rounded-full",
              isInterviewStarted 
                ? "bg-emerald-500 animate-pulse" 
                : (statusText.toLowerCase().includes('connecting') || statusText.toLowerCase().includes('generating'))
                  ? "bg-amber-500 animate-pulse"
                  : (statusText.toLowerCase().includes('fail') || statusText.toLowerCase().includes('disconnect') || statusText.toLowerCase().includes('error'))
                    ? "bg-rose-500"
                    : "bg-zinc-500"
            )}></span>
            <span className="text-[10px] font-bold text-zinc-300 tracking-widest uppercase">{statusText}</span>
          </div>

          {(!isInterviewStarted && (
            statusText.toLowerCase().includes('fail') || 
            statusText.toLowerCase().includes('disconnect') || 
            statusText.toLowerCase().includes('error')
          )) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              className="text-[10px] font-bold uppercase py-1 px-4 h-8 rounded-full border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              Reconnect
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full border border-white/5 bg-white/[0.01] hover:bg-white/10 hover:border-white/10 transition-all duration-300" title="Settings">
            <Settings className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all duration-300" title="End call" onClick={leaveInterview}>
            <PhoneOff className="w-4 h-4 text-rose-400" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 pb-4">

        {/* Video Area (Left Column) */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          
          {/* AI Interviewer Card */}
          <div className="border border-white/10 bg-white/[0.01] backdrop-blur-md rounded-[2rem] p-6 flex flex-col items-center justify-center flex-1 relative overflow-hidden min-h-[300px] shadow-2xl">
            {/* Ambient glow decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/[0.02] blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative mb-6 mt-2 flex items-center justify-center w-40 h-40">
              {/* Decorative Orbiting Rings (Constant Rotation) */}
              <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.05] animate-[spin_30s_linear_infinite]" />
              <div className="absolute -inset-3 rounded-full border border-white/[0.02] animate-[spin_45s_linear_infinite_reverse]" />
              <div className="absolute -inset-6 rounded-full border border-dotted border-white/[0.03] animate-[spin_60s_linear_infinite]" />

              {/* Audio-Driven Glow Elements */}
              <div ref={aiRing1Ref} className="absolute inset-0 rounded-full bg-white/[0.015] border border-white/10 blur-sm pointer-events-none opacity-0" />
              <div ref={aiRing2Ref} className="absolute -inset-3 rounded-full bg-white/[0.005] border border-white/5 blur-md pointer-events-none opacity-0" />

              {/* Central visualizer orb */}
              <div
                ref={aiVisualizerRef}
                className={cn(
                  "w-28 h-28 rounded-full border border-white/10 bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center relative z-10 shadow-2xl transition-colors duration-300",
                  isAISpeaking ? "border-white/30" : "border-white/10"
                )}
              >
                {/* Metallic Inner Ring / Gradient Overlay */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Frequency waveform bars */}
                <div ref={aiBarsRef} className="flex items-center gap-1.5 z-20">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <div
                      key={bar}
                      className="w-[2px] bg-white rounded-full"
                      style={{
                        height: '8px',
                        opacity: 0.4
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-white tracking-tight z-10">AI Interviewer</h4>
            <div className="mt-2 text-xs font-semibold tracking-wide uppercase text-zinc-500 z-10">
              {isAISpeaking ? (
                <span className="text-white flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  Speaking
                </span>
              ) : (
                "Listening for response"
              )}
            </div>
          </div>

          {/* Webcam Card */}
          <div 
            ref={webcamWrapperRef}
            className="relative flex flex-col shrink-0 h-[200px] lg:h-[220px] rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.01] backdrop-blur-md shadow-2xl transition-all duration-300 animate-fade-in"
          >
            <div className="w-full h-full relative">
              {showCamera ? (
                <WebcamViewer
                  key="interview-camera"
                  className="w-full h-full object-cover"
                  onStreamReady={handleCameraStreamReady}
                  onError={handleCameraError}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                  <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Feed loading</span>
                </div>
              )}
              {cameraError && (
                <div className="absolute bottom-3 left-3 right-3 bg-rose-500/90 text-white text-xs p-2.5 rounded-xl text-center backdrop-blur-md border border-rose-500/20 shadow-lg">
                  {cameraError}
                </div>
              )}

              {showCamera && !cameraError && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1 rounded-full shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-bold text-zinc-300 tracking-wider uppercase">Live Feed</span>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Chat Area (Right Column) */}
        <div className="lg:col-span-8 flex flex-col flex-1 min-h-0">
          <div className="flex flex-col flex-1 h-[450px] lg:h-full border border-white/10 bg-white/[0.01] backdrop-blur-md rounded-[2rem] shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-zinc-400" /> Live Transcript
              </h4>
              <div className="bg-white/[0.02] text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                Question {questionIndex + 1} of {totalQuestions}
              </div>
            </div>

            {/* Scrollable conversation log */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 chat-scrollbar min-h-0" ref={chatBoxRef}>
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2.5 text-zinc-500 text-xs tracking-widest uppercase font-bold animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600 mb-1" />
                  Connection established. Waiting for agent...
                </div>
              ) : (
                conversation.map((item, index) => (
                  <div key={index} className={`flex ${item.type.startsWith('ai') ? 'justify-start' : 'justify-end'}`}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-[2rem] shadow-md relative animate-fade-in transition-all duration-300",
                      item.type.startsWith('ai')
                        ? "bg-white/[0.02] text-zinc-300 rounded-tl-sm border border-white/5 hover:border-white/10"
                        : "bg-white/[0.06] text-white rounded-tr-sm border border-white/10 hover:border-white/20"
                    )}>
                      <div className={cn(
                        "font-semibold text-[9px] mb-1 tracking-widest uppercase",
                        item.type.startsWith('ai') ? "text-zinc-500" : "text-zinc-400"
                      )}>
                        {item.type.startsWith('ai') ? 'AI Interviewer' : 'You'}
                      </div>
                      <div className="text-sm leading-relaxed">{item.text}</div>
                      <div className={cn(
                        "text-[9px] opacity-40 mt-2 text-right",
                        item.type.startsWith('ai') ? "text-zinc-500" : "text-zinc-400"
                      )}>
                        {new Date(item.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 mt-auto border-t border-white/5 shrink-0 flex items-center justify-between min-h-[64px] bg-white/[0.01]">
              <div className="flex items-center gap-3">
                {isInterviewStarted && !isInterviewCompleted && !isAISpeaking && (
                  <div className="flex items-center text-xs font-bold tracking-wide uppercase text-zinc-400 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full shadow-inner animate-pulse">
                    <Mic id="user-mic-vol" className="w-3.5 h-3.5 text-white mr-1.5 transition-transform duration-75" />
                    Listening
                  </div>
                )}
                {isAISpeaking && (
                  <div className="flex items-center text-xs font-bold tracking-wide uppercase text-zinc-400 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full shadow-inner">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-zinc-500" />
                    AI Interviewer Speaking
                  </div>
                )}
              </div>

              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!isInterviewStarted || isInterviewCompleted || isAISpeaking}
                    className="text-xs font-bold uppercase tracking-wider py-1.5 px-4 h-9 rounded-full border-white/10 bg-white/[0.02] hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-md gap-2"
                  >
                    <span>Quick Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-white/10 bg-zinc-950/90 backdrop-blur-md text-zinc-300 rounded-2xl p-1.5 min-w-[200px] shadow-2xl">
                  {[
                    { label: "Request Hint", text: "Can you give me a hint for this question?" },
                    { label: "Clarify Question", text: "Could you please clarify what you mean by that question?" },
                    { label: "Give Example", text: "Could you provide an example of what you are looking for?" },
                    { label: "Repeat Question", text: "Can you please repeat the question?" },
                  ].map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={() => handleSendQuickMessage(action.text)}
                      className="text-xs py-2 px-3 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

      </div>

      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 border border-white/10 bg-zinc-950/80 backdrop-blur-md rounded-3xl shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">End Interview Early?</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to exit? If you end now, we will complete the session and generate performance feedback based on your responses so far.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1 rounded-full py-2.5 text-xs font-bold border border-white/5 hover:bg-white/[0.02] text-zinc-400 hover:text-white"
              >
                Continue
              </Button>
              <Button
                onClick={confirmEndInterviewEarly}
                className="flex-1 rounded-full py-2.5 text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                Yes, End Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
