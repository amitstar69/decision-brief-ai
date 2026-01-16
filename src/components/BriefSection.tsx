
  'use client';

  import { useState } from 'react';
  import { BriefSection as BriefSectionType } from '@/lib/briefParser';

  type BriefSectionProps = {
    section: BriefSectionType;
    isFirst?: boolean;
  };

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    teal: 'bg-teal-50 border-teal-200 text-teal-900',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    teal: 'bg-teal-100',
  };

  export default function BriefSection({ section, isFirst }: BriefSectionProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(section.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    };

    const colorClass = colorClasses[section.color as keyof typeof colorClasses] || colorClasses.blue;
    const iconBgClass = iconBgClasses[section.color as keyof typeof iconBgClasses] || iconBgClasses.blue;

    return (
      <div className={`border rounded-lg overflow-hidden transition-all ${isFirst ? '' : 'mt-4'}`}>
        <div 
          className={`px-4 py-3 border-b cursor-pointer select-none ${colorClass}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${iconBgClass} rounded-lg flex items-center justify-center text-lg`}>
                {section.icon}
              </div>
              <h3 className="font-semibold text-base">
                {section.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="text-xs px-2 py-1 rounded hover:bg-white/50 transition-colors"
                title="Copy section"
              >
                {copySuccess ? '✓ Copied' : '📋 Copy'}
              </button>
              <span className="text-sm">
                {isCollapsed ? '▼' : '▲'}
              </span>
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <div className="bg-white px-4 py-4">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
              {section.content}
            </pre>
          </div>
        )}
      </div>
    );
  }
