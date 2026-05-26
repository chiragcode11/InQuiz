import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewConfig, QuestionType } from '../types';
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_OPTIONS, DURATION_OPTIONS, DEFAULT_CONFIG } from '../utils/constants';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Loader2, CheckCircle2, Plus, Minus,
  Zap, Cpu, Crown, Code2, BrainCircuit, Briefcase, Sparkles, Layers, Clock, Terminal, ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Particles } from '@/components/motion/particles';
import { cn } from '@/lib/utils';

const InterviewSetup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeId, resumeData } = location.state || {};

  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  if (!resumeId) {
    navigate('/upload');
    return null;
  }

  const handleConfigChange = (field: keyof InterviewConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionTypeToggle = (questionType: QuestionType) => {
    const newTypes = config.question_types.includes(questionType)
      ? config.question_types.filter(type => type !== questionType)
      : [...config.question_types, questionType];

    if (newTypes.length > 0) {
      handleConfigChange('question_types', newTypes);
    }
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateQuestions(resumeId, config);
      navigate('/interview', {
        state: {
          interviewId: result.interview_id,
          questions: result.questions,
          config: config
        }
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 py-20 bg-black text-white selection:bg-white/20 font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Particles from Home Page */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={60}
        ease={80}
        color="#ffffff"
        refresh
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-2xl flex flex-col space-y-6 transition-all duration-1000",
          hasLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        {/* Centered setup badge, title, & description inspired by Home Page */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-white opacity-80 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">AI Customizer</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-1 leading-tight">
            Configure Your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Interview Session</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm max-w-md mt-1 leading-relaxed">
            Adjust the AI parameters below. Your detected skills and experience context are automatically loaded.
          </p>
        </div>

        {/* Floating Profile Context pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold tracking-wide uppercase">
          <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>{resumeData?.skills?.length || 0} Skills</span>
          </span>
          <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md text-zinc-400">
            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
            <span>{resumeData?.experience?.length || 0} Projects</span>
          </span>
          <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md text-zinc-400">
            <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
            <span>{resumeData?.education?.length || 0} Education</span>
          </span>
        </div>

        {/* Settings options list */}
        <div className="space-y-6 divide-y divide-white/5">

          {/* Difficulty Level Slider */}
          <div className="pt-5 first:pt-0">
            <div className="flex flex-col items-center text-center mb-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Step 1</h4>
              <h3 className="text-lg font-bold text-white tracking-tight">Select Difficulty</h3>
            </div>

            {/* Timeline selector track */}
            <div className="relative flex justify-between items-start max-w-md mx-auto px-4 pt-4 pb-2">
              {/* Connecting line */}
              <div className="absolute left-8 right-8 h-[1px] bg-white/20 top-[24px]" />

              {/* Option markers */}
              {DIFFICULTY_OPTIONS.map((option) => {
                const isSelected = config.difficulty === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleConfigChange('difficulty', option.value)}
                    className="relative z-10 flex flex-col items-center group focus:outline-none"
                  >
                    {/* Marker dot */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center bg-black",
                      isSelected
                        ? "border-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                        : "border-zinc-800 group-hover:border-zinc-500"
                    )}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-[11px] font-bold mt-3 tracking-wide uppercase transition-colors",
                      isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-400"
                    )}>
                      {option.label.replace(' Level', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Areas pills */}
          <div className="pt-6">
            <div className="flex flex-col items-center text-center mb-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Step 2</h4>
              <h3 className="text-lg font-bold text-white tracking-tight">Choose Focus Areas</h3>
            </div>

            <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
              {QUESTION_TYPE_OPTIONS.map(option => {
                const IconComponent = option.value === 'technical' ? Code2 : option.value === 'behavioral' ? BrainCircuit : Briefcase;
                const isSelected = config.question_types.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleQuestionTypeToggle(option.value)}
                    className={cn(
                      "flex items-center gap-2.5 px-6 py-3.5 rounded-full border text-xs font-bold transition-all duration-300 backdrop-blur-md",
                      isSelected
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.03]"
                        : "bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Questions Count side-by-side controls */}
          <div className="pt-6 grid md:grid-cols-2 gap-6 max-w-lg mx-auto">
            {/* Duration pills */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration</span>
              </div>

              <div className="flex gap-2">
                {DURATION_OPTIONS.map(option => {
                  const isSelected = config.duration_minutes === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleConfigChange('duration_minutes', option.value)}
                      className={cn(
                        'w-11 h-11 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all duration-300',
                        isSelected
                          ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-[1.05]'
                          : 'bg-white/[0.02] text-zinc-500 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {option.label.replace(' minutes', 'm')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions Counter */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Questions</span>
              </div>

              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-md">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="w-8 h-8 rounded-full hover:bg-white/10 transition-transform active:scale-90"
                  onClick={() => config.num_questions > 3 && handleConfigChange('num_questions', config.num_questions - 1)}
                  disabled={config.num_questions <= 3}
                >
                  <Minus className="w-3.5 h-3.5 text-white" />
                </Button>

                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-xl font-black text-white leading-none tracking-tighter">{config.num_questions}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="w-8 h-8 rounded-full hover:bg-white/10 transition-transform active:scale-90"
                  onClick={() => config.num_questions < 10 && handleConfigChange('num_questions', config.num_questions + 1)}
                  disabled={config.num_questions >= 10}
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 border-t border-white/5">
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-zinc-500 hover:text-white rounded-full px-8 py-6 text-xs font-semibold border border-white/5 hover:bg-white/[0.02] transition-all gap-2"
            onClick={() => navigate('/upload')}
            disabled={isGenerating}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
 
          <Button
            size="lg"
            className="w-full sm:w-auto rounded-full px-10 py-6 text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all gap-2 group shadow-[0_4px_25px_rgba(255,255,255,0.08)] hover:shadow-[0_4px_35px_rgba(255,255,255,0.2)]"
            onClick={generateQuestions}
            disabled={isGenerating || config.question_types.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-black" />
                Generating Curriculum...
              </>
            ) : (
              <>
                Start Interview <ChevronRight className="w-4 h-4 stroke-[2.5px] group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;