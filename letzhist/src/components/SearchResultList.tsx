import Link from 'next/link';
import { Story } from './data_types';

type Props = {
  items: Story[];
};

export default function SearchResultList({ items }: Props) {
  return (
    <div className="w-full">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={String(item.slug)} className="p-3 bg-white rounded shadow-sm flex items-center gap-4 hover:bg-slate-200">
            {item.leadImage?.url ? (
            
              <img src={item.leadImage.url} alt={item.leadImage?.alt ?? ''} className="w-20 h-14 object-cover rounded" />
            ) : (
              <div className="w-20 h-14 bg-slate-100 rounded" />
            )}
            <div className="flex-1 ">
              <Link
                href={`/stories/${item.slug}`}
                className="text-uni-blue font-semibold"
              >
                {item.title ?? 'Untitled'}
              </Link>
              <div className="text-sm text-slate-500 ">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
