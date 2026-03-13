// src/components/AIAssistPanel.tsx
import { useRole } from '@/context/RoleContext';
import { useTime } from '@/context/TimeContext';
import { SparklesIcon, PaperAirplaneIcon, BoltIcon } from '@heroicons/react/24/outline';

export const AIAssistPanel = () => {
  const { role } = useRole();
  const { hour, isMorning, isAfternoon } = useTime();

  // Context-aware suggestions
  const suggestions = (() => {
    if (role === 'receptionist' && isMorning) {
      return [
        { id: '1', text: 'M. Novak (R-789) — soba 204 prosta', actions: ['Send SMS', 'Assign Room'] },
        { id: '2', text: 'A. Žnidaršič (R-790) — čaka na ključ', actions: ['Call', 'Ask AI for upsell'] },
      ];
    }
    if (role === 'manager' && isAfternoon) {
      return [
        { id: '3', text: 'Revenue: +€1,240 today vs yesterday', actions: ['View report', 'Export CSV'] },
        { id: '4', text: 'Occupancy: 87% — 3 rooms free', actions: ['Promote last-minute', 'Check pricing'] },
      ];
    }
    return [
      { id: '5', text: 'AI suggested ‘Alpine Spa’ upsell for guest M. Novak', actions: ['Apply', 'Edit prompt'] },
      { id: '6', text: 'SEO card generated for “Winter Escape” package', actions: ['Preview', 'Schedule'] },
    ];
  })();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-indigo-600" />
          AI Assist
        </h3>
        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
          Live
        </span>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="ai-query" className="sr-only">Ask AI</label>
          <div className="relative">
            <input
              id="ai-query"
              type="text"
              placeholder="Kdo je danes prišel in še ni check-in?"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-12 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <BoltIcon className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              🔍 Iskanje: reservations.status = 'confirmed' AND check_in_time &lt;= now AND check_in_done = false
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Predlogi</h4>
          <ul className="space-y-3">
            {suggestions.map((s) => (
              <li key={s.id} className="border-l-4 border-indigo-500 pl-3 py-1">
                <p className="text-sm font-medium text-gray-900">{s.text}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {s.actions.map((action, i) => (
                    <button
                      key={i}
                      className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};