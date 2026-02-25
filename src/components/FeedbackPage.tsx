import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewSession, InterviewResponse } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { } from '@/components/ui/progress';
import { Loader2, Download, TrendingUp, CheckCircle, AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react';
import { Particles } from '@/components/motion/particles';

const FeedbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};

  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const [interviewData] = await Promise.all([
        apiService.getInterview(interviewId),
        apiService.getConversation(interviewId)
      ]);

      setInterview(interviewData);
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
  }

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

  const overallScore = calculateOverallScore(interview.responses);
  const avgCompleteness = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.completeness_score || 0), 0) / (interview.responses.length || 1));
  const avgAccuracy = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.accuracy_score || 0), 0) / (interview.responses.length || 1));
  const avgClarity = Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.clarity_score || 0), 0) / (interview.responses.length || 1));

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4 md:px-8 print:bg-white print:text-black bg-black">
      <Particles
        className="absolute inset-0 z-0 print:hidden"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />
      <div className="relative z-10 max-w-5xl w-full space-y-12 animate-fade-in">

        {/* Header Section */}
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Performance <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Feedback</span></h1>
          <p className="text-lg text-muted-foreground">Detailed analysis and actionable insights to master your next interview</p>
        </header>

        {/* Overview Score Card */}
        <Card className="glass-card border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="grid md:grid-cols-12 gap-10 items-center">

            {/* Main Score Ring */}
            <div className="md:col-span-4 flex flex-col items-center justify-center">
              <div
                className="w-48 h-48 rounded-full border-[10px] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] shadow-inner mb-4 relative z-10"
                style={{ borderColor: getScoreColor(overallScore) }}
              >
                <span className="text-6xl font-black text-white">{overallScore}</span>
                <span className="text-xl text-muted-foreground font-semibold">/ 10</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Overall Score</h3>
              <p className="text-sm text-muted-foreground mt-1">Based on {interview.responses.length} responses</p>
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
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" /> Detailed Response Analysis
          </h3>

          {interview.responses.map((response, index) => (
            <Card key={index} className="glass-panel border-white/5 rounded-2xl p-6 md:p-8 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-semibold text-white mb-2 leading-snug">{response.question_text}</h4>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative">
                    <span className="absolute -top-3 left-4 bg-background text-xs font-bold px-2 py-0.5 rounded text-muted-foreground uppercase tracking-wider">Your Answer</span>
                    <p className="text-gray-300 italic text-sm md:text-base leading-relaxed mt-1">"{response.user_response}"</p>
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
