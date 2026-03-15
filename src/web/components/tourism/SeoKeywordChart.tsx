// SEO Keyword Chart component
export function SeoKeywordChart({ keywords }: { keywords?: any[] }) {
  return (
    <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-sm">SEO Keyword Analysis</div>
        <div className="text-xs mt-1">
          {keywords?.length || 0} keywords tracked
        </div>
      </div>
    </div>
  );
}
