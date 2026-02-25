import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, BrainCircuit, Mic, FileCode2, LineChart } from 'lucide-react';
import { AnimatedGridPattern } from '@/components/motion/animated-grid-pattern';
import { GridFeatureCards } from '@/components/motion/grid-feature-cards';
import DatabaseWithRestApi from '@/components/motion/database-with-rest-api';
import { Footerdemo } from '@/components/motion/footer-section';
import { Particles } from '@/components/motion/particles';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';



const MockEnvironmentSection = () => {
  return (
    <section className="py-24 relative z-10 w-full">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 leading-tight">
            Master your interview.
          </h2>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-500 mb-6 leading-tight">
            Focus on coding.
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
            From instant resume analysis to real-time voice interviews, InQuiz handles the complex mock environment so you can scale your skills without the headache.
          </p>
        </div>

        {/* Right Content - Visual Diagram */}
        <div className="relative h-[400px] w-full overflow-hidden flex items-center justify-center">
          <DatabaseWithRestApi
            title="Instant Data Sync"
            circleText="API"
            lightColor="#ffffff"
            badgeTexts={{
              first: "RESUME",
              second: "AUDIO",
              third: "FEEDBACK",
              fourth: "REPORT"
            }}
            buttonTexts={{
              first: "InQuiz Core",
              second: "AI Analysis"
            }}
          />
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  return (
    <div className="min-h-[85vh] relative overflow-hidden flex flex-col bg-black text-white selection:bg-white/20 font-sans">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 border-b border-white/5 pt-16">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.15}
          duration={3}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[150%] skew-y-12"
          )}
        />

        {/* Grayscale Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl w-full mx-auto space-y-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-white opacity-80 animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">Introducing InQuiz Beta</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold text-center tracking-tighter text-white leading-[1.1] "
          >
            Master Your Next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
              Interview with AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-zinc-400 font-normal max-w-2xl text-center tracking-wide leading-relaxed"
          >
            Create, manage, and scale your interview prep with our all-in-one platform. No complex setups, just pure practice power.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto gap-2"
              onClick={() => navigate('/upload')}
            >
              Start Practicing Free <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: hasLoaded ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="text-xs text-zinc-600 mt-4"
          >
            No credit card required • Free forever plan
          </motion.p>
        </div>
      </section>

      {/* --- CONTENT WRAPPER WITH PARTICLES --- */}
      <div className="relative w-full">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />

        {/* --- FEATURES SECTION --- */}
        <section className="py-24 relative z-10 w-full border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                Everything you need to succeed.
              </h2>
            </div>

            <GridFeatureCards />
          </div>
        </section>

        {/* --- NEW AUTOMATION / MOCK ENVIRONMENT SECTION --- */}
        <MockEnvironmentSection />

        {/* --- FOOTER --- */}
        <Footerdemo />

      </div>
    </div>
  );
};

export default HomePage;