import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Layers, ArrowRightLeft } from 'lucide-react';

const TRANSITION_TYPES = [
  { type: 'fade', name: 'Fade', icon: '🌅' },
  { type: 'dissolve', name: 'Dissolve', icon: '✨' },
  { type: 'wipe', name: 'Wipe', icon: '🔄' },
  { type: 'slide', name: 'Slide', icon: '➡️' },
] as const;

export const TransitionsPanel: React.FC = () => {
  const { project, addTransition, removeTransition } = useEditorStore();

  const handleAddTransition = (type: string) => {
    // Find the selected clip or the last clip
    const allClips = project.tracks.flatMap(t => t.clips);
    if (allClips.length < 2) return;
    
    const lastClip = allClips[allClips.length - 1];
    addTransition({
      type: type as any,
      duration: 1,
      clipId: lastClip.id,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h3 className="text-white text-sm font-medium flex items-center gap-2">
          <ArrowRightLeft size={14} /> Transitions
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-gray-400 mb-3">Click to add between clips</p>
        
        <div className="grid grid-cols-2 gap-2">
          {TRANSITION_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => handleAddTransition(t.type)}
              className="flex flex-col items-center gap-1 p-3 bg-[#0d0d1a] hover:bg-[#2a2a4a] border border-[#2a2a4a] hover:border-purple-500/50 rounded-lg transition-all"
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-xs text-gray-300">{t.name}</span>
            </button>
          ))}
        </div>

        {/* Existing transitions */}
        {project.transitions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs text-gray-400 mb-2">Applied Transitions</h4>
            <div className="space-y-1">
              {project.transitions.map(transition => (
                <div
                  key={transition.id}
                  className="flex items-center justify-between p-2 bg-[#0d0d1a] rounded border border-[#2a2a4a]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {TRANSITION_TYPES.find(t => t.type === transition.type)?.icon}
                    </span>
                    <span className="text-xs text-gray-300 capitalize">{transition.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{transition.duration}s</span>
                    <button
                      onClick={() => removeTransition(transition.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.transitions.length === 0 && (
          <div className="mt-6 text-center">
            <Layers size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No transitions applied</p>
            <p className="text-gray-600 text-[10px] mt-1">Add at least 2 clips to use transitions</p>
          </div>
        )}
      </div>
    </div>
  );
};
