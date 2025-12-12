import Link from 'next/link';
import { Story } from './data_types';

type Props = {
  items: Story[];
};

export default function SearchResultList({ items }: Props) {
  return (
    <div className="space-y-4">
      {items.map((story) => (
        <div key={story.id}>
        <Link href={`/stories/${story.slug}`}>
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
            {/* Image */}
            <div className="flex gap-4">
              {story.leadImage && (
                <img
                  src={story.leadImage.url}
                  alt={story.leadImage.alt}
                  className="w-24 h-24 object-cover rounded"
                />
              )}

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 hover:text-uni-blue">
                  {story.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Last Updated: {new Date(story.lastEdited).toLocaleDateString()}
                </p>
                {story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
        </div>
      ))}
    </div>
  );
}
