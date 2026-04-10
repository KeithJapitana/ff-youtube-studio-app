import { useState } from "react";
import { VideoStateProvider } from "./hooks/useVideoState";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Step1_VideoDetails from "./components/steps/Step1_VideoDetails";
import Step2_Generate from "./components/steps/Step2_Generate";
import Step3_Review from "./components/steps/Step3_Review";
import Step4_Thumbnail from "./components/steps/Step4_Thumbnail";
import Step5_Export from "./components/steps/Step5_Export";

const STEPS = [
  Step1_VideoDetails,
  Step2_Generate,
  Step3_Review,
  Step4_Thumbnail,
  Step5_Export,
];

function AppContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const StepComponent = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-base-950 flex flex-col">
      <Header
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar
          currentStep={currentStep}
          onStepClick={(step) => {
            setCurrentStep(step);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 animate-fade-in-up">
            <StepComponent
              onNext={() => setCurrentStep((s) => Math.min(s + 1, 4))}
              onBack={() => setCurrentStep((s) => Math.max(s - 1, 0))}
              onReset={() => setCurrentStep(0)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <VideoStateProvider>
      <AppContent />
    </VideoStateProvider>
  );
}
