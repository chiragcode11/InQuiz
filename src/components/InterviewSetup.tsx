import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewConfig, QuestionType } from '../types';
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_OPTIONS, DURATION_OPTIONS, DEFAULT_CONFIG } from '../utils/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings2, ArrowLeft, Loader2, PlayCircle, CheckCircle2, ChevronDown, Plus, Minus } from 'lucide-react';
import { Particles } from '@/components/motion/particles';

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

      setTimeout(() => {
        navigate('/interview', {
          state: {
            interviewId: result.interview_id,
            questions: result.questions,
            config: config
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 py-12 bg-black">
      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />
      <Card
        className={`relative z-10 w-full max-w-4xl p-8 md:p-12 glass-card rounded-3xl border-white/10 transition-all duration-1000 ${hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
      >
        <div className="flex items-center mb-10 gap-4 border-b border-white/10 pb-8">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 shrink-0" onClick={() => navigate('/upload')}>
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Interview Setup
            </h2>
            <p className="text-muted-foreground text-lg">Fine-tune the AI parameters to match your goals</p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-full bg-white/10 items-center justify-center ring-4 ring-white/5">
            <Settings2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Resume Summary Section */}
        <div className="mb-10 p-6 bg-white/5 rounded-2xl border border-white/5 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-300"></div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-zinc-300" /> Active Resume Context
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                {resumeData?.skills?.length || 0}
              </div>
              <span className="text-gray-300">Skills Detected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                {resumeData?.experience?.length || 0}
              </div>
              <span className="text-gray-300">Experience Entries</span>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Difficulty Level */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Difficulty Level</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIFFICULTY_OPTIONS.map(option => (
                <div
                  key={option.value}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group
                      ${config.difficulty === option.value
                      ? 'border-zinc-400 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                      : 'border-white/10 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  onClick={() => handleConfigChange('difficulty', option.value)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-lg font-bold ${config.difficulty === option.value ? 'text-white' : 'text-zinc-400'}`}>
                      {option.label}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                        ${config.difficulty === option.value ? 'border-zinc-300' : 'border-muted-foreground'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-zinc-300 transition-all duration-300 ${config.difficulty === option.value ? 'scale-100' : 'scale-0'}`}></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Focus Areas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTION_TYPE_OPTIONS.map(option => (
                <div
                  key={option.value}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start group
                      ${config.question_types.includes(option.value)
                      ? 'border-zinc-400 bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  onClick={() => handleQuestionTypeToggle(option.value)}
                >
                  <div className={`w-6 h-6 rounded-md border-2 mt-0.5 transition-all duration-300 flex items-center justify-center mr-4 shrink-0
                      ${config.question_types.includes(option.value) ? 'bg-zinc-300 border-zinc-300 text-black' : 'border-muted-foreground'}`}>
                    {config.question_types.includes(option.value) && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className={`text-lg font-bold mb-1 block ${config.question_types.includes(option.value) ? 'text-white' : 'text-zinc-400'}`}>
                      {option.label}
                    </span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration & Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-3xl border border-white/5">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Interview Duration</h4>
              <div className="relative">
                <select
                  value={config.duration_minutes}
                  onChange={(e) => handleConfigChange('duration_minutes', parseInt(e.target.value))}
                  className="w-full p-4 rounded-xl glass-card border border-white/10 text-white font-medium appearance-none focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 cursor-pointer"
                >
                  {DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Number of Questions</h4>
              <div className="flex items-center justify-between p-2 rounded-xl glass-card border border-white/10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-lg hover:bg-white/10"
                  onClick={() => config.num_questions > 3 && handleConfigChange('num_questions', config.num_questions - 1)}
                  disabled={config.num_questions <= 3}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white leading-none">{config.num_questions}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Questions</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-lg hover:bg-white/10"
                  onClick={() => config.num_questions < 10 && handleConfigChange('num_questions', config.num_questions + 1)}
                  disabled={config.num_questions >= 10}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-end items-center mt-12 pt-8 border-t border-white/10">
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-muted-foreground hover:text-white rounded-full"
            onClick={() => navigate('/upload')}
            disabled={isGenerating}
          >
            Back
          </Button>

          <Button
            size="lg"
            className="w-full sm:w-auto rounded-full px-10 py-6 text-lg font-bold bg-white text-black hover:bg-zinc-200 transition-all transform hover:-translate-y-1 group"
            onClick={generateQuestions}
            disabled={isGenerating || config.question_types.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                Generating Curriculum...
              </>
            ) : (
              <>
                Start Interview <PlayCircle className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InterviewSetup;