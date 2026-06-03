export interface TooltipState {
  word: string;
  x: number;
  y: number;
  translation?: string;
  description?: string;
  lemma?: string;
  sense?: string;
}

interface Props {
  tooltip: TooltipState;
  onDismiss: () => void;
}

export default function WordTooltip({ tooltip, onDismiss }: Props) {
  return (
    <div
      data-tooltip
      style={{
        position: "fixed",
        left: Math.min(tooltip.x + 8, window.innerWidth - 240),
        top: tooltip.y + 16,
      }}
      className="z-50 w-56 rounded-xl bg-white shadow-lg ring-1 ring-stone-200 px-4 py-3 text-sm text-stone-700"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-semibold text-stone-900 mb-1">{tooltip.word}</p>
      {tooltip.translation ? (
        <>
          <p className="text-amber-700 font-medium">{tooltip.translation}</p>
          {tooltip.description && (
            <p className="text-stone-400 text-xs mt-1">{tooltip.description}</p>
          )}
          {(tooltip.lemma || tooltip.sense) && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              {tooltip.lemma && (
                <p className="text-stone-400 text-xs italic">{tooltip.lemma}</p>
              )}
              {tooltip.sense && (
                <p className="text-stone-400 text-xs mt-0.5">{tooltip.sense}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-stone-400 italic">definition coming soon</p>
      )}
    </div>
  );
}
