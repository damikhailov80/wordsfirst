import { listDesks } from "@/lib/desks/repository";
import DeskListItem from "@/app/components/desk/DeskListItem";

export default async function DesksPage() {
  const desks = await listDesks();

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 min-h-screen">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-1">
            Колоды
          </h1>
          <p className="text-zinc-500 text-sm">
            Повторяйте слова с помощью карточек
          </p>
        </div>

        {desks.length === 0 && (
          <p className="text-zinc-400 text-sm">Колоды не найдены.</p>
        )}

        <div className="flex flex-col gap-4">
          {desks.map((desk) => (
            <DeskListItem key={desk.id} desk={desk} />
          ))}
        </div>
      </div>
    </div>
  );
}
