"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Header from '@/components/header';
import {PageData, DiscussionComment} from '@/components/data_types';

type PageViewProps = {
  page: PageData;
};

export const PageView: React.FC<PageViewProps> = ({ page }) => {
  const [activeTab, setActiveTab] = useState<"article" | "discussion">(
    "article",
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 lg:flex-row">
        {/* Main content */}
        <section className="flex-1">
          {/* Page title + meta */}
          <div className="mb-4 border-b border-slate-200 pb-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="mt-1 text-sm text-slate-500">{page.subtitle}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Last edited {page.lastEdited} by{" "}
              <span className="font-medium text-slate-500">
                {page.lastEditedBy}
              </span>
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-4 border-b border-slate-200">
            <nav className="-mb-px flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab("article")}
                className={`border-b-2 px-1 pb-2 ${
                  activeTab === "article"
                    ? "border-sky-500 font-medium text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Article
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discussion")}
                className={`border-b-2 px-1 pb-2 ${
                  activeTab === "discussion"
                    ? "border-sky-500 font-medium text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Discussion
                {page.discussion.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                    {page.discussion.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === "article" ? (
            <ArticleTab page={page} />
          ) : (
            <DiscussionTab comments={page.discussion} />
          )}
        </section>

        {/* Right sidebar */}
        <aside className="w-full max-w-xs space-y-4 lg:w-72">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page info
            </h2>
            <dl className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Last edited</dt>
                <dd>{page.lastEdited}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Editor</dt>
                <dd>{page.lastEditedBy}</dd>
              </div>
              {page.tags && page.tags.length > 0 && (
                <div className="pt-2">
                  <dt className="mb-1 text-slate-500">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {page.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <p className="mb-1 font-medium text-slate-700">About this page</p>
            <p>
              Historical article contributed by local users. Content may be
              expanded or corrected over time.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

const ArticleTab: React.FC<{ page: PageData }> = ({ page }) => {
  return (
    <article className="prose prose-slate max-w-none">
      {/* Optional lead image floated like Wikipedia */}
      {page.leadImage && (
        <figure className="float-right ml-4 mb-2 w-52 border border-slate-200 bg-slate-50 p-2">
          <img
            src={page.leadImage.url}
            alt={page.leadImage.alt}
            className="mx-auto mb-1 h-auto w-full object-cover"
          />
          {page.leadImage.caption && (
            <figcaption className="text-xs text-slate-500">
              {page.leadImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {page.sections.map((section) => (
        <section key={section.id} className="mb-8">
          {section.title && <h2>{section.title}</h2>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {section.markdown}
          </ReactMarkdown>
        </section>
      ))}
    </article>
  );
};

const DiscussionTab: React.FC<{ comments: DiscussionComment[] }> = ({
  comments,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
        This is the discussion area for this page. Use it to suggest edits,
        ask for sources, or coordinate improvements. (UI only – no backend yet.)
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">
          No discussion yet. Be the first to start a conversation.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-medium text-slate-800">{c.author}</span>
                <span className="text-xs text-slate-400">{c.createdAt}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* UI-only "New comment" form (no submit logic) */}
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
        <p className="mb-2 text-sm font-medium text-slate-800">New comment</p>
        <textarea
          rows={3}
          placeholder="Share your thoughts about this page…"
          className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="cursor-not-allowed rounded-md bg-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
          >
            Post (disabled – no backend)
          </button>
        </div>
      </div>
    </div>
  );
};
