import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewConfig, DifficultyLevel, QuestionType } from '../types';
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_OPTIONS, DURATION_OPTIONS, DEFAULT_CONFIG } from '../utils/constants';

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
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 font-sans flex items-center justify-center relative overflow-hidden p-6">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-transparent to-transparent"></div>
      </div>

      <div
        className={`relative z-10 w-full max-w-4xl p-8 bg-gray-900 rounded-3xl border border-gray-700 shadow-2xl shadow-orange-500/10 transition-all duration-1000 ${
          hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
            Interview Setup
          </h2>
          <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
            Customize your interview experience based on your preferences
          </p>
        </div>

        {/* Resume Summary Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl border border-gray-700 animate-fade-in">
          <h3 className="text-xl font-bold text-orange-400 mb-4">Resume Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-white">1.Skills Found:</span>
              <span className="text-gray-400 ml-2">{resumeData?.skills?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold text-white">2. Experience and Project Entries:</span>
              <span className="text-gray-400 ml-2">{resumeData?.experience?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Interview Configuration Section */}
        <div className="setup-content">
          <h3 className="text-2xl font-semibold text-white mb-6">Interview Configuration</h3>

          {/* Difficulty Level */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-orange-400 mb-3">Difficulty Level</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIFFICULTY_OPTIONS.map(option => (
                <div
                  key={option.value}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${config.difficulty === option.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-orange-500 hover:bg-gray-700'
                    }`}
                  onClick={() => handleConfigChange('difficulty', option.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{option.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 border-gray-500 transition-all duration-300 flex items-center justify-center
                      ${config.difficulty === option.value ? 'bg-orange-500 border-orange-500' : 'bg-transparent'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${config.difficulty === option.value ? 'bg-white scale-100' : 'bg-transparent scale-0'}`}></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-orange-400 mb-3">Question Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTION_TYPE_OPTIONS.map(option => (
                <div
                  key={option.value}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center
                    ${config.question_types.includes(option.value)
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-orange-500 hover:bg-gray-700'
                    }`}
                  onClick={() => handleQuestionTypeToggle(option.value)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 border-gray-500 transition-all duration-300 flex items-center justify-center mr-3
                    ${config.question_types.includes(option.value) ? 'bg-orange-500 border-orange-500' : 'bg-transparent'}`}>
                    {config.question_types.includes(option.value) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-bold text-white">{option.label}</span>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration & Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-lg font-semibold text-orange-400 mb-3">Interview Duration</h4>
              <select
                value={config.duration_minutes}
                onChange={(e) => handleConfigChange('duration_minutes', parseInt(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-gray-300 appearance-none focus:outline-none focus:border-orange-500"
              >
                {DURATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-orange-400 mb-3">Number of Questions</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-gray-300">
                <button
                  onClick={() => config.num_questions > 3 && handleConfigChange('num_questions', config.num_questions - 1)}
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={config.num_questions <= 3}
                >
                  -
                </button>
                <span className="text-xl font-bold">{config.num_questions}</span>
                <button
                  onClick={() => config.num_questions < 10 && handleConfigChange('num_questions', config.num_questions + 1)}
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={config.num_questions >= 10}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={generateQuestions}
            className="flex-1 min-w-0 sm:min-w-[200px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 relative overflow-hidden group disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed"
            disabled={isGenerating || config.question_types.length === 0}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </span>
            ) : (
              'Generate & Start Interview'
            )}
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"></span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex-1 min-w-0 sm:min-w-[200px] bg-gray-700 hover:bg-gray-600 text-white font-semibold text-lg px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;