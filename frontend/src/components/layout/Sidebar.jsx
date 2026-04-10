import { ProgressStep } from "../ui/ProgressStep";

const STEPS = [
  { number: 1, label: "Video Details" },
  { number: 2, label: "Generate" },
  { number: 3, label: "Review" },
  { number: 4, label: "Thumbnail" },
  { number: 5, label: "Export" },
];

function Sidebar({ currentStep, onStepClick, isOpen, onClose }) {
  return (
    <>
      <aside className="hidden lg:flex flex-col w-80 border-r border-white/5 bg-base-900/30 p-6 relative">
        <SidebarContent currentStep={currentStep} onStepClick={onStepClick} />
      </aside>
      <aside
        className={`fixed inset-y-0 left-0 w-80 bg-base-900 border-r border-white/5 z-40 p-6 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Navigation</p>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent currentStep={currentStep} onStepClick={onStepClick} />
      </aside>
    </>
  );
}

function SidebarContent({ currentStep, onStepClick }) {
  return (
    <>
      <div className="mb-8">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-2">Progress</p>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-display font-bold text-white">
            {currentStep + 1}
            <span className="text-lg text-white/30">/{STEPS.length}</span>
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 w-6 rounded-full transition-all duration-300 ${i <= currentStep ? "bg-brand-secondary" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </div>
      <nav className="space-y-2">
        {STEPS.map((step) => {
          const isActive = currentStep === step.number - 1;
          const isCompleted = currentStep > step.number - 1;
          const isClickable = isCompleted || step.number - 1 === currentStep + 1;
          return (
            <ProgressStep key={step.number} number={step.number} label={step.label} isActive={isActive} isCompleted={isCompleted} onClick={() => isClickable && onStepClick(step.number - 1)} />
          );
        })}
      </nav>
      <div className="mt-8">
        <div className="p-4 bg-gradient-to-br from-brand-primary/20 to-transparent border border-brand-secondary/20 rounded-xl">
          <p className="text-xs text-brand-secondary font-medium">Pro Tip</p>
          <p className="text-xs text-white/50 mt-1">Import multiple videos at once to process them in batch mode.</p>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
