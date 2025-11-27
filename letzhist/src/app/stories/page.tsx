"use client";

import { PageView} from "@/components/page_view";
import {PageData} from "@/components/data_types";


const mockPage: PageData = {
  id: "12345",
  slug: "old-town-square",
  title: "Old Town Square",
  subtitle: "Central plaza of the historic district",
  lastEdited: "2025-11-18",
  lastEditedBy: "ArmandoF",
  tags: ["Architecture", "19th century", "Town life"],
  leadImage: {
    url: "/images/lux-old-town.jpg",    
    alt: "View of the Old Town Square",
    caption: "The Old Town Square seen from the south side, ca. 1920.",
  },
  sections: [
    {
      id: "intro",
      title: "Overview",
      markdown: `
The **Old Town Square** has been the heart of the city’s social and economic life since the late 18th century.

It is surrounded by townhouses, cafés, and the former guild hall.

For more context, see also the article on [City Market Street](/pages/city-market-street).
      `.trim(),
    },
    {
      id: "history",
      title: "Historical background",
      markdown: `
## Early market

Originally a simple marketplace, the square evolved into a formal civic space after the great fire of **1823**.

![Market stalls in 1905](/images/market-1905.jpg)

During the 20th century, the square hosted:

- Seasonal fairs
- Political demonstrations
- Military parades

You can also find related documents in the _Municipal Archive_, especially the **Fire of 1823 report**.

For a full list of archival sources, see:

1. _“Reconstruction of the Old Town”_ (1927)
2. _“Urban Life and Local Markets”_ (1954)
      `.trim(),
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
