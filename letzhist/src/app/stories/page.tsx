"use client";

import { PageView} from "@/components/page_view";
import {PageData} from "@/components/data_types";


const mockPage: PageData = {
  title: "Old Town Square",
  subtitle: "Central plaza of the historic district",
  lastEdited: "2025-11-18",
  lastEditedBy: "ArmandoF",
  tags: ["Architecture", "19th century", "Town life"],
  sections: [
    {
      id: "intro",
      title: "Overview",
      content:
        "The Old Town Square has been the heart of the city’s social and economic life since the late 18th century. " +
        "Surrounded by townhouses, cafés, and the former guild hall, it remains a central meeting point for locals and visitors.",
    },
    {
      id: "history",
      title: "Historical background",
      content:
        "Originally a simple marketplace, the square evolved into a formal civic space after the great fire of 1823. " +
        "Reconstruction efforts introduced neoclassical facades and a more regular layout, while market stalls were moved to the adjacent streets.\n\n" +
        "During the 20th century, the square hosted public events, demonstrations, and seasonal fairs. Several buildings were damaged during the war " +
        "but later restored, often using historic photographs as references.",
    },
  ],
  discussion: [
    {
      id: "c1",
      author: "LocalArchivist",
      createdAt: "2025-11-10",
      body:
        "Should we add a section about the weekly farmers’ market? I have a few photos from the 1950s that could be used as references.",
    },
    {
      id: "c2",
      author: "HistoryStudent92",
      createdAt: "2025-11-12",
      body:
        "I think the paragraph about the great fire of 1823 needs a citation. The date is correct, but the source is missing.",
    },
  ],
};

export default function HomePage() {
  return <PageView page={mockPage} />;
}
