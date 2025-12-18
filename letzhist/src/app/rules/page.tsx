import { FaBookOpen, FaPenFancy, FaBalanceScale, FaCopyright, FaUserShield } from 'react-icons/fa';

export default function RulesPage() {
  const lastUpdated = "December 15, 2025 (v1.0)";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-uni-blue text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <FaBookOpen className="text-2xl opacity-80" />
            <h1 className="text-3xl font-bold">Community Guidelines</h1>
          </div>
          <p className="opacity-90">
            To maintain LetzHist as a reliable and welcoming resource for local history, all contributors must abide by these rules.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 text-slate-700">
          
          {/* Rule 1: Accuracy */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-uni-blue">
                <FaPenFancy size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Accuracy & Attribution</h2>
              <p className="mb-2">
                History relies on evidence. All significant claims must be supported by reliable sources.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li><strong>Cite your sources:</strong> Use the source fields to credit books, archives, or oral histories.</li>
                <li><strong>No speculation:</strong> Clearly distinguish between established facts and local legends/folklore.</li>
                <li><strong>Original research:</strong> While we welcome local knowledge, please provide context (e.g., "Family records show...") rather than stating it as universal fact without proof.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Rule 2: Civil Discourse */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <FaUserShield size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. Civility & Conduct</h2>
              <p className="mb-2">
                LetzHist is a collaborative community. Treat fellow historians and readers with respect.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li><strong>Zero Tolerance:</strong> Hate speech, harassment, threats, or discrimination based on race, religion, gender, or nationality will result in an immediate ban.</li>
                <li><strong>Constructive Criticism:</strong> When correcting others, focus on the facts, not the person. Use the <em>Discussion</em> tab to resolve disagreements politely.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Rule 3: Copyright */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <FaCopyright size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Copyright & Media</h2>
              <p className="mb-2">
                Only upload images and documents that you have the right to share.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li><strong>Public Domain:</strong> Content published before certain dates (e.g., 100+ years ago) is usually safe, but please verify.</li>
                <li><strong>Ownership:</strong> Do not upload photos taken by others without their explicit permission.</li>
                <li><strong>Privacy:</strong> Do not post private information about living individuals without their consent (GDPR compliance).</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Rule 4: Disputes */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <FaBalanceScale size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. Dispute Resolution</h2>
              <p className="text-sm text-slate-600 mb-2">
                If you encounter content that violates these rules or is factually incorrect, please use the <strong>Report</strong> button found on comments or the Dispute tool for stories.
              </p>
              <p className="text-sm text-slate-600">
                Moderators review all reports. Repeated violations of these rules may lead to account suspension.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Current Version: {lastUpdated}</span>
          <span>Contact Admins for questions</span>
        </div>
      </div>
    </div>
  );
}