import type { PronounSense } from "./StoryReader";

export interface TooltipState {
  word: string;
  x: number;
  y: number;
  translation?: string;
  description?: string;
  lemma?: string;
  sense?: string;
  pronounSenses?: PronounSense[];
}

interface Props {
  tooltip: TooltipState;
  onDismiss: () => void;
}

export default function WordTooltip({ tooltip, onDismiss }: Props) {
  const isPronoun = !!tooltip.pronounSenses;
  const tooltipWidth = isPronoun ? 288 : 224;

  return (
    <div
      data-tooltip
      style={{
        position: "fixed",
        left: Math.min(tooltip.x + 8, window.innerWidth - tooltipWidth - 16),
        top: tooltip.y + 16,
        width: tooltipWidth,
      }}
      className="z-50 rounded-xl bg-white shadow-lg ring-1 ring-stone-200 px-4 py-3 text-sm text-stone-700"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <p className="font-semibold text-stone-900">{tooltip.word}</p>
        {tooltip.lemma && (
          <p className="text-stone-400 text-xs italic">← {tooltip.lemma}</p>
        )}
      </div>

      {isPronoun ? (
        <div className="space-y-2.5">
          {tooltip.pronounSenses!.map((sense, i) => (
            <div key={i} className={i > 0 ? "pt-2 border-t border-stone-100" : ""}>
              <p className="text-sky-700 font-medium">{sense.translation}</p>
              <p className="text-stone-500 text-xs mt-1 italic">{sense.context}</p>
              <p className="text-stone-400 text-xs mt-0.5">{sense.context_translation}</p>
            </div>
          ))}
        </div>
      ) : tooltip.translation ? (
        <>
          <p className="text-amber-700 font-medium">{tooltip.translation}</p>
          {tooltip.description && (
            <p className="text-stone-400 text-xs mt-1">{tooltip.description}</p>
          )}
          {tooltip.sense && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <p className="text-stone-400 text-xs mt-0.5">{tooltip.sense}</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-stone-400 italic">definition coming soon</p>
      )}
    </div>
  );
}
