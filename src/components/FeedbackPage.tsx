import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewSession, InterviewResponse } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, TrendingUp, CheckCircle, AlertTriangle, MessageSquare, ChevronRight, Mic, User } from 'lucide-react';
import { Particles } from '@/components/motion/particles';
import { cn } from '@/lib/utils';

const FeedbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};

  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'transcript'>('metrics');

  useEffect(() => {
    if (!interviewId) {
      navigate('/');
      return;
    }

    loadInterviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, navigate]);

  const loadInterviewData = async () => {
    try {
      const [interviewData, conversationData] = await Promise.all([
        apiService.getInterview(interviewId),
        apiService.getConversation(interviewId)
      ]);

      setInterview(interviewData);
      setConversation(conversationData?.conversation || interviewData?.conversation || []);
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallScore = (responses: InterviewResponse[]) => {
    if (!responses.length) return 0;

    const totalScore = responses.reduce((sum, response) => {
      const analysis = response.analysis;
      if (analysis) {
        return sum + (analysis.completeness_score + analysis.accuracy_score + analysis.clarity_score) / 3;
      }
      return sum;
    }, 0);

    return Math.round(totalScore / responses.length);
  };

  const getScoreColor = (score: number, asTailwindClass = false) => {
    if (score >= 8) return asTailwindClass ? 'text-emerald-400 bg-emerald-400/10' : '#34d399';
    if (score >= 6) return asTailwindClass ? 'text-amber-400 bg-amber-400/10' : '#fbbf24';
    return asTailwindClass ? 'text-rose-400 bg-rose-400/10' : '#fb7185';
  };

  const getProgressColorClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-400';
    if (score >= 6) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-black">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
        <Card className="max-w-md w-full p-10 glass-card text-center relative z-10 animate-fade-in border-white/10">
          <Loader2 className="w-12 h-12 text-zinc-400 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Generating Feedback</h2>
          <p className="text-muted-foreground">Please wait while our AI analyzes your performance...</p>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-black">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
        <Card className="max-w-md w-full p-8 glass-card text-center relative z-10 border-white/10">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Interview Not Found</h2>
          <p className="text-muted-foreground mb-8">We couldn't locate the data for this session.</p>
          <Button onClick={() => navigate('/')} size="lg" className="rounded-full w-full bg-white text-black hover:bg-zinc-200">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Enforce 5-minute threshold check
  const startedTime = interview.started_at 
    ? new Date(interview.started_at).getTime() 
    : interview.created_at 
      ? new Date(interview.created_at).getTime() 
      : 0;
  const completedTime = interview.completed_at ? new Date(interview.completed_at).getTime() : 0;
  const lastResponseTime = interview.responses && interview.responses.length > 0 
    ? new Date(interview.responses[interview.responses.length - 1].timestamp).getTime() 
    : 0;
  const endTime = completedTime || lastResponseTime || Date.now();
  const durationMs = startedTime > 0 ? Math.max(0, endTime - startedTime) : 0;
  const durationMinutes = durationMs / (1000 * 60);
  const isShortSession = durationMinutes < 5;

  const overallScore = calculateOverallScore(interview.responses);
  const avgCompleteness = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.completeness_score || 0), 0) / (interview.responses.length || 1));
  const avgAccuracy = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.accuracy_score || 0), 0) / (interview.responses.length || 1));
  const avgClarity = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.clarity_score || 0), 0) / (interview.responses.length || 1));

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-16 px-4 md:px-8 print:bg-white print:text-black bg-black">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />

      <Particles
        className="absolute inset-0 z-0 print:hidden"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />
      <div className="relative z-10 max-w-5xl w-full flex flex-col space-y-10 animate-fade-in">

        {/* Header Section */}
        <header className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-white opacity-80 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">Analysis Report</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-1 leading-tight">
            Performance <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Feedback</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm max-w-md mt-2 leading-relaxed">
            Detailed analysis and actionable insights to master your next interview.
          </p>
        </header>

        {/* Tab Selector */}
        <div className="inline-flex p-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md max-w-md mx-auto self-center shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setActiveTab('metrics')}
            className={cn(
              "rounded-full py-2.5 px-6 text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'metrics'
                ? "bg-white text-black shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Metrics & Scores
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn(
              "rounded-full py-2.5 px-6 text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'transcript'
                ? "bg-white text-black shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Conversation Transcript
          </button>
        </div>

        {/* Tab Contents: Metrics & Scores */}
        {activeTab === 'metrics' && (
          isShortSession ? (
            <Card className="border border-white/5 bg-white/[0.01] rounded-[2rem] p-10 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
              <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-5 animate-pulse" />
              <h3 className="text-2xl font-bold text-white mb-3">Practice Session Under 5 Minutes</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed mb-8">
                A minimum of 5 minutes of interview activity is required to generate complete score metrics and detailed breakdown reports. Try again with a full-length practice session!
              </p>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Session Duration</span>
                <span className="text-2xl font-mono font-bold text-white bg-white/5 border border-white/10 px-5 py-2 rounded-full">{formatDuration(durationMs)}</span>
              </div>
            </Card>
          ) : (
            <div className="space-y-10">
              {/* Overview Score Card */}
              <Card className="border border-white/5 bg-white/[0.01] rounded-[2rem] p-8 md:p-12 relative overflow-hidden backdrop-blur-md shadow-2xl animate-fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
 
                <div className="grid md:grid-cols-12 gap-10 items-center">
 
                  {/* Main Score Ring */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center">
                    <div className="relative mb-5 flex items-center justify-center w-44 h-44">
                      {/* Dynamic Background Glow */}
                      <div 
                        className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-500 animate-pulse"
                        style={{ backgroundColor: getScoreColor(overallScore) }}
                      />
                      <div
                        className="w-full h-full rounded-full border-[8px] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md relative z-10 shadow-2xl"
                        style={{ borderColor: getScoreColor(overallScore) }}
                      >
                        <span className="text-5xl font-black text-white leading-none">{overallScore}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1.5">Score / 10</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Overall Score</h3>
                    <p className="text-xs text-muted-foreground mt-1">Based on {interview.responses.length} responses</p>
                  </div>

                  {/* Score Breakdown Bars */}
                  <div className="md:col-span-8 flex flex-col justify-center space-y-8">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-white" /> Key Metrics Breakthrough
                    </h3>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-300">Completeness</span>
                          <span className="text-white">{avgCompleteness}/10</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColorClass(avgCompleteness)}`} style={{ width: `${avgCompleteness * 10}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-300">Accuracy</span>
                          <span className="text-white">{avgAccuracy}/10</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColorClass(avgAccuracy)}`} style={{ width: `${avgAccuracy * 10}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-300">Clarity</span>
                          <span className="text-white">{avgClarity}/10</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColorClass(avgClarity)}`} style={{ width: `${avgClarity * 10}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>

              {/* Detailed Feedback List */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-cyan-400" /> Detailed Response Analysis
                </h3>

                {interview.responses.map((response, index) => (
                  <Card key={index} className="border border-white/5 bg-white/[0.01] rounded-[2rem] p-6 md:p-8 hover:border-white/10 transition-colors backdrop-blur-sm shadow-2xl">
                    <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-base shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base md:text-lg font-semibold text-white mb-3 leading-snug">{response.question_text}</h4>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Your Answer</span>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                          <p className="text-zinc-300 italic text-sm leading-relaxed">"{response.user_response}"</p>
                        </div>
                      </div>
                    </div>

                    {response.analysis && (
                      <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3 space-y-4">
                          <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Scores</h5>
                          <div className="flex flex-col gap-2">
                            <div className={`flex justify-between text-xs font-bold px-3 py-2 rounded-lg ${getScoreColor(response.analysis.completeness_score, true)}`}>
                              <span>Completeness</span> <span>{response.analysis.completeness_score}/10</span>
                            </div>
                            <div className={`flex justify-between text-xs font-bold px-3 py-2 rounded-lg ${getScoreColor(response.analysis.accuracy_score, true)}`}>
                              <span>Accuracy</span> <span>{response.analysis.accuracy_score}/10</span>
                            </div>
                            <div className={`flex justify-between text-xs font-bold px-3 py-2 rounded-lg ${getScoreColor(response.analysis.clarity_score, true)}`}>
                              <span>Clarity</span> <span>{response.analysis.clarity_score}/10</span>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-9 grid sm:grid-cols-2 gap-6">
                          {response.analysis.strengths.length > 0 && (
                            <div>
                              <h5 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> What Went Well
                              </h5>
                              <ul className="space-y-2">
                                {response.analysis.strengths.map((str, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                                    {str}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {response.analysis.missing_points.length > 0 && (
                            <div>
                              <h5 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Areas to Improve
                              </h5>
                              <ul className="space-y-2">
                                {response.analysis.missing_points.map((point, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        )}

        {/* Tab Contents: Conversational Transcript */}
        {activeTab === 'transcript' && (
          <Card className="border border-white/5 bg-white/[0.01] rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-cyan-400" /> Dialogue Transcription & Analysis
            </h3>
            
            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 chat-scrollbar">
              {conversation.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs font-semibold tracking-wider uppercase">
                  No conversation logs available.
                </div>
              ) : (
                conversation.map((item, index) => {
                  const isAI = item.type.startsWith('ai') || item.type.startsWith('assistant');
                  
                  // Match user turns with corresponding graded responses to pull AI suggestions inline
                  let matchingResponse = null;
                  if (!isAI && interview.responses) {
                    matchingResponse = interview.responses.find(r => 
                      item.text.toLowerCase().includes(r.user_response.toLowerCase()) ||
                      r.user_response.toLowerCase().includes(item.text.toLowerCase())
                    );
                  }
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-[2rem] shadow-md relative border transition-all duration-300",
                          isAI
                            ? "bg-white/[0.02] text-zinc-300 border-white/5 rounded-tl-sm"
                            : "bg-white/[0.06] text-white border-white/10 rounded-tr-sm"
                        )}>
                          <div className={cn(
                            "font-semibold text-[9px] mb-1.5 tracking-widest uppercase flex items-center gap-1",
                            isAI ? "text-zinc-500" : "text-zinc-400"
                          )}>
                            {isAI ? (
                              <><Mic className="w-3 h-3" /> AI Interviewer</>
                            ) : (
                              <><User className="w-3 h-3" /> You</>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed">{item.text}</div>
                        </div>
                      </div>
                      
                      {/* Graded AI suggestion displayed inline below user turn if feedback exists */}
                      {!isAI && matchingResponse && matchingResponse.analysis && (
                        <div className="flex justify-end animate-fade-in">
                          <div className="max-w-[80%] w-full p-5 border border-cyan-500/10 bg-cyan-500/[0.02] rounded-3xl shadow-inner text-xs leading-relaxed text-zinc-300 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] blur-xl rounded-full pointer-events-none"></div>
                            
                            <div className="font-bold text-cyan-400 uppercase tracking-wider text-[9px] mb-2 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" /> AI Suggestion & Feedback
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-zinc-400 font-semibold">Turn Analysis:</span>
                                <p className="text-zinc-300 mt-0.5">{matchingResponse.analysis.overall_feedback || "No specific feedback recorded."}</p>
                              </div>
                              
                              {matchingResponse.analysis.areas_for_improvement && matchingResponse.analysis.areas_for_improvement.length > 0 && (
                                <div>
                                  <span className="text-amber-400 font-semibold">How to improve:</span>
                                  <ul className="list-disc pl-4 mt-1 space-y-1 text-zinc-400">
                                    {matchingResponse.analysis.areas_for_improvement.map((area: string, idx: number) => (
                                      <li key={idx}>{area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 border-t border-white/10 print:hidden">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto rounded-full glass hover:bg-white/10 px-8"
            onClick={() => window.print()}
          >
            <Download className="w-5 h-5 mr-2" /> Download Report
          </Button>
          <Button
            size="lg"
            className="w-full sm:w-auto rounded-full px-8 bg-white text-black hover:bg-zinc-200 transition-all font-semibold"
            onClick={() => navigate('/')}
          >
            Start New Interview <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

      </div>
    </div>
  );
};

export default FeedbackPage;
