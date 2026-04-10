import { Card } from "./Card";

export function HookOption({ hook, selected, onClick }) {
  return (
    <Card
      className={`p-5 cursor-pointer transition-all duration-300 ${
        selected
          ? "border-brand-secondary/50 bg-brand-primary/10"
          : "border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <p className={`font-display font-bold text-lg ${selected ? "text-brand-secondary" : "text-white"}`}>
          {hook.heading}
        </p>
        <p className={`text-sm ${selected ? "text-white/70" : "text-white/40"}`}>
          {hook.subheading}
        </p>
      </div>
    </Card>
  );
}
