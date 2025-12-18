"use client";

import { StoryViewDTO } from "@/components/data_types";

export async function useStoryView(slug: string) {

  let storyDTO: StoryViewDTO | null = null

  const fetchStoryData = async () => {
    fetch(`/api/stories/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        storyDTO = data;
      })
      .catch((err) => {
        console.error('ERROR', err);
      });
  };

  await fetchStoryData();

return storyDTO;
}