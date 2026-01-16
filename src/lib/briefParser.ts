export type BriefSection = {
    id: string;
    title: string;
    content: string;
    icon: string;
    color: string;
  };

  export function parseBrief(briefText: string): BriefSection[] {
    const sections: BriefSection[] = [];

    const sectionConfig = [
      {
        title: 'SUMMARY',
        icon: '📋',
        color: 'blue',
        id: 'summary'
      },
      {
        title: "WHAT'S HAPPENING",
        icon: '📊',
        color: 'purple',
        id: 'whats-happening'
      },
      {
        title: 'WHY THIS MATTERS',
        icon: '💡',
        color: 'indigo',
        id: 'why-matters'
      },
      {
        title: 'BUSINESS IMPACT',
        icon: '💰',
        color: 'green',
        id: 'business-impact'
      },
      {
        title: 'KEY DECISIONS',
        icon: '🎯',
        color: 'orange',
        id: 'key-decisions'
      },
      {
        title: 'RISKS & WATCHOUTS',
        icon: '⚠️',
        color: 'red',
        id: 'risks'
      },
      {
        title: 'NEXT 3 ACTIONS (90-DAY WINDOW)',
        icon: '✅',
        color: 'teal',
        id: 'actions'
      },
    ];

    // Split by section headings
    const lines = briefText.split('\n');
    let currentSection: BriefSection | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this line is a section header
      const matchedConfig = sectionConfig.find(config =>
        trimmedLine.toUpperCase().includes(config.title)
      );

      if (matchedConfig) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          id: matchedConfig.id,
          title: matchedConfig.title,
          content: '',
          icon: matchedConfig.icon,
          color: matchedConfig.color,
        };
      } else if (currentSection && trimmedLine) {
        // Add content to current section
        currentSection.content += line + '\n';
      }
    }

    // Push the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  export function highlightPriorities(content: string): string {
    // Add color coding for P0, P1, P2
    let highlighted = content;

    // P0 - Critical (red)
    highlighted = highlighted.replace(
      /(P0[^\n]*)/gi,
      '<span class="priority-p0">$1</span>'
    );

    // P1 - High value (orange)
    highlighted = highlighted.replace(
      /(P1[^\n]*)/gi,
      '<span class="priority-p1">$1</span>'
    );

    // P2 - Exploratory (blue)
    highlighted = highlighted.replace(
      /(P2[^\n]*)/gi,
      '<span class="priority-p2">$1</span>'
    );

    return highlighted;
  }
