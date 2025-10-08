import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api'; 

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [resumeData, setResumeData] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setUploadStatus('');
      } else {
        setUploadStatus('Please select a PDF file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Processing your resume...');

    try {
      const result = await apiService.uploadResume(file);
      setResumeData(result);
      setUploadStatus('Resume processed successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/setup', { state: { resumeId: result.resume_id, resumeData: result } });
      }, 1500);
    } catch (error) {
      setUploadStatus('Error processing resume. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadStatus('');
    } else {
      setUploadStatus('Please drop a PDF file.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 font-sans flex items-center justify-center relative overflow-hidden p-6">
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-transparent to-transparent"></div>
      </div>

      <div 
        className={`relative z-10 w-full max-w-2xl p-8 bg-gray-900 rounded-3xl border border-gray-700 shadow-2xl shadow-orange-500/10 transition-all duration-1000 ${
          hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
            Upload Your Resume
          </h2>
          <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
            Upload your resume in PDF format to get started with personalized interview questions
          </p>
        </div>

        <div 
          className={`relative p-8 border-2 border-dashed rounded-xl transition-all duration-300
            ${file ? 'border-orange-500 bg-gray-800' : 'border-gray-600 hover:border-orange-500 hover:bg-gray-800'}
          `}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {file ? (
              <div className="flex flex-col items-center">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110">📄</div>
                <div className="text-lg font-semibold text-white mb-1">{file.name}</div>
                <div className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4 text-orange-400">📤</div>
                <p className="text-gray-300 text-lg font-medium">Drag and drop your PDF resume here</p>
                <p className="text-gray-500 text-sm my-2">or</p>
                <label htmlFor="file-input" className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full transition-colors duration-300 transform hover:scale-105">
                  Choose File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⏱️</span>
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Please note:</span> Our backend service may take 1-2 minutes to start up on first use. If upload fails initially, please wait a moment and try again. We appreciate your patience!
            </div>
          </div>
        </div>

        {uploadStatus && (
          <div className={`mt-6 text-center text-sm font-medium p-3 rounded-lg ${
            uploadStatus.includes('Error') ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'
          }`}>
            {uploadStatus}
          </div>
        )}

        <div className="mt-8">
          {isUploading && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-gray-400 font-semibold text-lg">Processing...</span>
            </div>
          )}

          {resumeData && (
            <div className="mt-8 p-6 bg-gray-800 rounded-2xl border border-gray-700 animate-fade-in">
              <h3 className="text-xl font-bold text-orange-400 mb-4">Resume Analysis Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Skills Found ({resumeData.skills.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Experience Sections ({resumeData.experience.length})</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
                    {resumeData.experience.slice(0, 3).map((exp: string, index: number) => (
                      <li key={index} className="truncate">{exp.substring(0, 80)}...</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row gap-4 justify-center mt-8 ${isUploading ? 'hidden' : ''}`}>
            {file && !isUploading && !resumeData && (
              <button
                onClick={handleUpload}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 relative overflow-hidden group"
              >
                Process Resume
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"></span>
              </button>
            )}
            
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
