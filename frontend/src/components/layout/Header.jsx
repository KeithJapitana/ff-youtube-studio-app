function Header({ currentStep, totalSteps, onMenuClick }) {
  return (
    <header className="h-16 sm:h-20 border-b border-white/5 bg-base-900/50 backdrop-blur-xl sticky top-0 z-20">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <img src="/favicon.webp" alt="FF Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-brand-primary/30" />
          <div className="hidden sm:flex flex-col items-center">
            <img src="/ff-name.webp" alt="FranchiseFilming" className="h-7 sm:h-9" />
            <p className="text-xs text-white/40 font-mono tracking-wider uppercase hidden lg:block">YouTube Studio</p>
          </div>
          <div className="lg:hidden">
            <p className="text-xs text-white/40 font-mono">{currentStep + 1}/{totalSteps}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm text-white/60">Ready</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
