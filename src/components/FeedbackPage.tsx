import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { InterviewSession, InterviewResponse } from '../types';

const FeedbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};
  
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<any[]>([]);

  useEffect(() => {
    if (!interviewId) {
      navigate('/');
      return;
    }
    
    loadInterviewData();
  }, [interviewId, navigate]);

  const loadInterviewData = async () => {
    try {
      const [interviewData, conversationData] = await Promise.all([
        apiService.getInterview(interviewId),
        apiService.getConversation(interviewId)
      ]);
      
      setInterview(interviewData);
      setConversation(conversationData.conversation || []);
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#28a745';
    if (score >= 6) return '#ffc107';
    return '#dc3545';
  };

  if (isLoading) {
    return (
      <div className="feedback-page">
        <div className="container">
          <div className="loading-feedback">
            <div className="spinner"></div>
            <h2>Generating your feedback...</h2>
            <p>Please wait while we analyze your interview performance.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="feedback-page">
        <div className="container">
          <h2>Interview not found</h2>
          <button onClick={() => navigate('/')} className="home-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore(interview.responses);

  return (
    <div className="feedback-page">
      <div className="container">
        <div className="feedback-header">
          <h1>Interview Feedback</h1>
          <p>Here's your detailed performance analysis</p>
        </div>

        <div className="feedback-content">
          <div className="score-overview">
            <div className="overall-score">
              <div className="score-circle" style={{ borderColor: getScoreColor(overallScore) }}>
                <span className="score-value">{overallScore}/10</span>
              </div>
              <h3>Overall Score</h3>
              <p>Based on {interview.responses.length} responses</p>
            </div>

            <div className="score-breakdown">
              {interview.responses.length > 0 && (
                <>
                  <div className="score-item">
                    <span className="label">Completeness</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${(interview.responses.reduce((sum, r) => sum + (r.analysis?.completeness_score || 0), 0) / interview.responses.length) * 10}%`,
                          backgroundColor: getScoreColor(interview.responses.reduce((sum, r) => sum + (r.analysis?.completeness_score || 0), 0) / interview.responses.length)
                        }}
                      ></div>
                    </div>
                    <span className="score">{Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.completeness_score || 0), 0) / interview.responses.length)}/10</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Accuracy</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${(interview.responses.reduce((sum, r) => sum + (r.analysis?.accuracy_score || 0), 0) / interview.responses.length) * 10}%`,
                          backgroundColor: getScoreColor(interview.responses.reduce((sum, r) => sum + (r.analysis?.accuracy_score || 0), 0) / interview.responses.length)
                        }}
                      ></div>
                    </div>
                    <span className="score">{Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.accuracy_score || 0), 0) / interview.responses.length)}/10</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Clarity</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${(interview.responses.reduce((sum, r) => sum + (r.analysis?.clarity_score || 0), 0) / interview.responses.length) * 10}%`,
                          backgroundColor: getScoreColor(interview.responses.reduce((sum, r) => sum + (r.analysis?.clarity_score || 0), 0) / interview.responses.length)
                        }}
                      ></div>
                    </div>
                    <span className="score">{Math.round(interview.responses.reduce((sum, r) => sum + (r.analysis?.clarity_score || 0), 0) / interview.responses.length)}/10</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="interview-transcript">
            <h3>Complete Interview Transcript</h3>
            <div className="transcript-content">
              {conversation.map((item, index) => (
                <div key={index} className={`transcript-item ${item.type}`}>
                  <div className="speaker">
                    {item.type.startsWith('ai') ? 'AI Interviewer' : 'You'}
                  </div>
                  <div className="content">{item.text}</div>
                  <div className="timestamp">
                    {new Date(item.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="detailed-feedback">
            <h3>Detailed Analysis</h3>
            {interview.responses.map((response, index) => (
              <div key={index} className="response-analysis">
                <div className="question">
                  <h4>Question {index + 1}</h4>
                  <p>{response.question_text}</p>
                </div>
                <div className="response">
                  <h5>Your Response</h5>
                  <p>{response.user_response}</p>
                </div>
                {response.analysis && (
                  <div className="analysis">
                    <div className="analysis-scores">
                      <span>Completeness: {response.analysis.completeness_score}/10</span>
                      <span>Accuracy: {response.analysis.accuracy_score}/10</span>
                      <span>Clarity: {response.analysis.clarity_score}/10</span>
                    </div>
                    {response.analysis.strengths.length > 0 && (
                      <div className="strengths">
                        <h6>Strengths:</h6>
                        <ul>
                          {response.analysis.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {response.analysis.missing_points.length > 0 && (
                      <div className="improvements">
                        <h6>Areas for Improvement:</h6>
                        <ul>
                          {response.analysis.missing_points.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="feedback-actions">
            <button onClick={() => navigate('/')} className="home-button">
              Start New Interview
            </button>
            <button onClick={() => window.print()} className="download-button">
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
