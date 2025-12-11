import React from "react";
import { RevisionLogEntry } from "@/components/data_types";

interface HistoryTabProps {
  history: RevisionLogEntry[];
  isLoading: boolean;
  currentRevId: string;
  onLoadRevision: (revId: string) => void;
};

export const HistoryTab: React.FC<HistoryTabProps> = ({ 
  history, 
  isLoading, 
  currentRevId, 
  onLoadRevision 
}) => (
  <div className="space-y-4">
    {isLoading ? (
      <div className="text-center py-8 text-slate-400">Loading version history...</div>
    ) : (
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Change Summary</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((entry) => (
              <tr key={entry.revisionId} className={entry.revisionId === currentRevId ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{entry.date}</td>
                <td className="px-4 py-3 font-medium text-uni-blue">{entry.author.username}</td>
                <td className="px-4 py-3 text-slate-600">{entry.changeMessage}</td>
                <td className="px-4 py-3 text-right">
                  {entry.revisionId === currentRevId ? (
                    <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">Current</span>
                  ) : (
                    <button 
                      onClick={() => onLoadRevision(entry.revisionId)}
                      className="text-xs text-uni-blue hover:underline"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);