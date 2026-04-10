import { Card } from "./Card";

export function TitleOption({ title, selected, onSelect }) {
  return (
    <Card
      className={`p-5 cursor-pointer transition-all duration-300 ${
        selected
          ? "border-brand-secondary/50 bg-brand-primary/10"
          : "border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          selected
            ? "border-brand-secondary bg-brand-secondary"
            : "border-white/20"
        }`}>
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className={`font-body font-medium ${selected ? "text-white" : "text-white/60"}`}>
          {title}
        </p>
      </div>
    </Card>
  );
}
