import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // This state helps trigger the fade-in animation on component mount
    setHasLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 font-sans relative overflow-hidden">
      {/* Background Gradient Effect - Subtle and elegant */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 animate-fade-in-up">
        {/* Header Section */}
        <header 
          className={`text-center mb-20 transition-all duration-1000 ${
            hasLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
            AI Interview Assistant
          </h1>
          <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto tracking-wide">
            Practice interviews with AI-powered feedback and adaptive questioning
          </p>
        </header>

        {/* Hero Section */}
        <div 
          className={`bg-gray-900 rounded-3xl p-8 md:p-12 mb-20 border border-gray-700 shadow-2xl shadow-orange-500/10 transition-all duration-1000 delay-200 ease-out ${
            hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
              Get Ready for Your Next Interview
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Upload your resume and practice with our AI interviewer that adapts to your experience level and provides real-time feedback
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {['📄', '🤖', '📊'].map((emoji, index) => (
              <div 
                key={index}
                className={`bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 transition-all duration-500 hover:transform hover:-translate-y-3 hover:shadow-2xl hover:shadow-orange-500/30 group cursor-pointer ${
                  hasLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150 + 500}ms` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500 text-center">
                  {emoji}
                </div>
                <h3 className="text-xl font-semibold text-orange-400 mb-3">
                  {index === 0 ? 'Resume Analysis' : index === 1 ? 'Voice AI Interviewer' : 'Detailed Feedback'}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {index === 0
                    ? 'AI analyzes your resume to generate relevant, personalized interview questions'
                    : index === 1
                    ? 'Real-time voice interview with adaptive questioning and natural conversation flow'
                    : 'Get comprehensive feedback, scoring, and improvement suggestions after each interview'}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-12 py-4 rounded-full transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500/50 relative overflow-hidden group"
              onClick={() => navigate('/upload')}
            >
              Start Your Interview Practice
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"></span>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div 
          className={`bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-700 shadow-2xl shadow-gray-700/10 transition-all duration-1000 delay-500 ease-out ${
            hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <h3 className="text-3xl font-semibold text-white text-center mb-12">
            How It Works
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {['1', '2', '3', '4'].map((step, index) => (
              <div 
                key={index}
                className={`text-center group transition-all duration-500 ${
                  hasLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150 + 800}ms` }}
              >
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-orange-500/30">
                  {step}
                </div>
                <h4 className="text-xl font-semibold text-white mb-4">
                  {index === 0 ? 'Upload Resume' : index === 1 ? 'Configure Interview' : index === 2 ? 'Voice Interview' : 'Get Feedback'}
                </h4>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {index === 0
                    ? 'Upload your PDF resume for comprehensive AI analysis and question generation'
                    : index === 1
                    ? 'Choose your difficulty level, question types, and interview duration preferences'
                    : index === 2
                    ? 'Practice with our intelligent AI interviewer using natural voice conversation'
                    : 'Receive detailed analysis, scores, and personalized improvement recommendations'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;