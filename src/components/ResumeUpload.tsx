import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadCloud, FileText, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Particles } from '@/components/motion/particles';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
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
        setUploadStatus('Error: Please select a PDF file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Processing your resume...');

    try {
      const result = await apiService.uploadResume(file);
      setUploadStatus('Resume processed successfully! Redirecting...');

      setTimeout(() => {
        navigate('/setup', { state: { resumeId: result.resume_id, resumeData: result } });
      }, 1500);
    } catch (error) {
      setUploadStatus('Error processing resume. Please try again.');
      console.error('Upload error:', error);
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
      setUploadStatus('Error: Please drop a PDF file.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-black">
      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />
      <Card
        className={`relative z-10 w-full max-w-2xl p-10 glass-card rounded-3xl border-white/10 transition-all duration-1000 ${hasLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
      >
        <div className="flex items-center mb-8 gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 shrink-0" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              Upload Resume
            </h2>
            <p className="text-muted-foreground text-sm">We need your PDF to generate personalized questions.</p>
          </div>
        </div>

        {isUploading ? (
          <div className="relative p-10 py-16 border border-white/10 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center text-center overflow-hidden animate-fade-in min-h-[300px]">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 blur-3xl rounded-full pointer-events-none" />

            {/* Glowing file/scanner container */}
            <div className="relative mb-8 w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {/* Dashed outer spin */}
              <div className="absolute inset-1 rounded-xl border border-dashed border-white/15 animate-spin" style={{ animationDuration: '10s' }} />
              
              {/* Floating PDF file icon */}
              <FileText className="w-10 h-10 text-zinc-300 relative z-10 animate-float" />
              
              {/* Scan laser line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 blur-[0.5px] animate-scan shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>

            {/* Status texts */}
            <div className="relative z-10 space-y-4 max-w-sm">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                {uploadStatus.includes('successfully') ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                )}
                <span>{uploadStatus.includes('successfully') ? 'Analysis Complete' : 'Analyzing Resume'}</span>
              </h3>
              
              <p className="text-zinc-400 text-sm font-medium transition-all duration-300">
                {uploadStatus}
              </p>

              {/* Progress bar */}
              <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden mx-auto border border-white/5 relative">
                <div className={`absolute top-0 bottom-0 left-0 h-full rounded-full transition-all ${
                  uploadStatus.includes('successfully') 
                    ? 'w-full bg-emerald-400 duration-500' 
                    : 'w-3/4 bg-white animate-progress-indeterminate'
                }`} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`relative p-10 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center
                ${file ? 'border-zinc-400 bg-white/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
              `}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="bg-white/10 p-4 rounded-full mb-4 ring-4 ring-white/5">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">{file.name}</div>
                  <div className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:bg-white/10 transition-colors">
                    <UploadCloud className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-white text-lg font-medium mb-1">Drag and drop your PDF here</p>
                  <p className="text-muted-foreground text-sm mb-6">Max file size 5MB</p>

                  <label htmlFor="file-input">
                    <Button type="button" size="lg" className="rounded-full bg-white text-black hover:bg-zinc-200 cursor-pointer pointer-events-none">
                      <span>Browse Files</span>
                    </Button>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <Clock className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="text-gray-300 font-medium">First-time use:</span> The backend might take 1-2 minutes to spin up. If the upload hangs, simply try again.
              </p>
            </div>

            {uploadStatus && uploadStatus.includes('Error') && (
              <div className="mt-6 flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-fade-in bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {uploadStatus}
              </div>
            )}
          </>
        )}

        <div className={`mt-8 flex justify-end transition-all ${isUploading || !file ? 'opacity-0 hidden' : 'opacity-100'}`}>
          <Button
            size="lg"
            onClick={handleUpload}
            className="w-full sm:w-auto rounded-full px-8 bg-white text-black hover:bg-zinc-200 transition-all font-semibold"
          >
            Start Analysis <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResumeUpload;
