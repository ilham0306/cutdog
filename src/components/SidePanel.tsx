import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { MediaPanel } from './MediaPanel';
import { TextPanel } from './TextPanel';
import { EffectsPanel } from './EffectsPanel';
import { TransitionsPanel } from './TransitionsPanel';
import { AudioPanel } from './AudioPanel';
import { Film, Type, Sliders, ArrowRightLeft, Music } from 'lucide-react';

const PANELS = [
  { id: 'media' as const, icon: Film, label: 'Media' },
  { id: 'text' as const, icon: Type, label: 'Text' },
  { id: 'effects' as const, icon: Sliders, label: 'Effects' },
  { id: 'transitions' as const, icon: ArrowRightLeft, label: 'Trans.' },
  { id: 'audio' as const, icon: Music, label: 'Audio' },
];

export const SidePanel: React.FC = () => {
  const { activePanel, setActivePanel } = useEditorStore();

  const renderPanel = () => {
    switch (activePanel) {
      case 'media': return <MediaPanel />;
      case 'text': return <TextPanel />;
      case 'effects': return <EffectsPanel />;
      case 'transitions': return <TransitionsPanel />;
      case 'audio': return <AudioPanel />;
      default: return <MediaPanel />;
    }
  };

  return (
    <div className="w-[280px] bg-[#161625] border-r border-[#2a2a4a] flex flex-col">
      {/* Panel Tabs */}
      <div className="flex border-b border-[#2a2a4a]">
        {PANELS.map(panel => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
              activePanel === panel.id
                ? 'text-purple-400 bg-[#1a1a2e] border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a2e]'
            }`}
          >
            <panel.icon size={14} />
            <span>{panel.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {renderPanel()}
      </div>
    </div>
  );
};
