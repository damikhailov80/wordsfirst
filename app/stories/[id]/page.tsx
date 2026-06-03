import { notFound } from "next/navigation";
import { getStoryRepository } from "@/lib/stories";
import StoryReader from "@/app/components/reader/StoryReader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const story = await getStoryRepository().getStory(id);

  if (!story) {
    notFound();
  }

  return (
    <StoryReader
      title={story.title}
      author={story.author}
      audioBasePath={story.audioBasePath}
      chapters={story.chapters}
      properNames={story.properNames}
      idioms={story.idioms}
      phrasalVerbs={story.phrasalVerbs}
    />
  );
}
