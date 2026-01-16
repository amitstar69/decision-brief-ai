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
        {/* Section Header */}
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

        {/* Section Content */}
        {!isCollapsed && (
          <div className="bg-white px-4 py-4">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatContent(section.content) 
              }}
            />
          </div>
        )}
      </div>
    );
  }

  function formatContent(content: string): string {
    let formatted = content.trim();

    // Highlight P0, P1, P2 priorities
    formatted = formatted.replace(
      /P0[^\n]*/gi,
      '<div class="flex items-start gap-2 mb-2"><span class="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">P0</span><span 
  class="flex-1">$&</span></div>'
    );

    formatted = formatted.replace(
      /P1[^\n]*/gi,
      '<div class="flex items-start gap-2 mb-2"><span class="inline-block px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded">P1</span><span 
  class="flex-1">$&</span></div>'
    );

    formatted = formatted.replace(
      /P2[^\n]*/gi,
      '<div class="flex items-start gap-2 mb-2"><span class="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">P2</span><span 
  class="flex-1">$&</span></div>'
    );

    // Format bullets with better spacing
    formatted = formatted.replace(/^•\s*/gm, '<span class="inline-block w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 align-middle"></span>');

    // Format line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-3">');
    formatted = formatted.replace(/\n/g, '<br/>');

    // Wrap in paragraph
    formatted = `<p class="text-slate-700 leading-relaxed mb-3">${formatted}</p>`;

    return formatted;
  }
