import { notFound } from "next/navigation";
import { getDesk } from "@/lib/desks/repository";
import StudySession from "@/app/components/desk/StudySession";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeskStudyPage({ params }: PageProps) {
  const { id } = await params;
  const desk = await getDesk(id);

  if (!desk) {
    notFound();
  }

  return <StudySession desk={desk} />;
}
