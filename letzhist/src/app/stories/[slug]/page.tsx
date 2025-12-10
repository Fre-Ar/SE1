import { PageView} from "@/components/PageView";
import { useStoryView } from '@/hooks/useStoryView';


interface StoryProps {
  params: Promise<{ slug: string }>;
}


export default async function Page({ params }: StoryProps) {

  const param = await params;
  const storyDTO = await useStoryView(param.slug);

  console.log('DTO:', storyDTO);
  
  if (storyDTO) return <PageView initialData={storyDTO} />;

  return <p> 404 page could not be found.</p>;
}
