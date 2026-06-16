"use client";

interface SessionProgressProps {
  done: number;
  total: number;
}

export default function SessionProgress({ done, total }: SessionProgressProps) {
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-zinc-500 mb-2">
        <span>{done} / {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
