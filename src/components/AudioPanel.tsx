import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Music, Volume2 } from 'lucide-react';

export const AudioPanel: React.FC = () => {
  const { project } = useEditorStore();
  
  const audioClips = project.tracks
    .filter(t => t.type === 'audio')
    .flatMap(t => t.clips);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h3 className="text-white text-sm font-medium flex items-center gap-2">
          <Volume2 size={14} /> Audio
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {audioClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Music size={24} className="text-gray-600 mb-2" />
            <p className="text-gray-500 text-xs">No audio clips</p>
            <p className="text-gray-600 text-[10px] mt-1">Import audio files from the Media panel</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audioClips.map(clip => {
              const media = project.mediaLibrary.find(m => m.id === clip.mediaId);
              return (
                <div key={clip.id} className="p-2 bg-[#0d0d1a] rounded-lg border border-[#2a2a4a]">
                  <div className="flex items-center gap-2 mb-2">
                    <Music size={12} className="text-green-400" />
                    <span className="text-xs text-white truncate">{media?.name || 'Audio'}</span>
                  </div>
                  {/* Waveform visualization */}
                  <div className="h-8 bg-[#1a1a2e] rounded flex items-center overflow-hidden">
                    <svg width="100%" height="100%" viewBox="0 0 200 32" preserveAspectRatio="none">
                      {Array.from({ length: 50 }, (_, i) => {
                        const height = Math.random() * 24 + 4;
                        return (
                          <rect
                            key={i}
                            x={i * 4}
                            y={16 - height / 2}
                            width={2}
                            height={height}
                            fill="#22c55e"
                            opacity={0.6}
                          />
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500">
                      {clip.startTime.toFixed(1)}s — {(clip.startTime + clip.duration).toFixed(1)}s
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Vol: {Math.round(clip.volume * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audio Settings */}
        <div className="mt-4 border-t border-[#2a2a4a] pt-3">
          <h4 className="text-xs text-gray-400 mb-2">Audio Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Sample Rate</span>
              <span className="text-xs text-white">48000 Hz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Channels</span>
              <span className="text-xs text-white">Stereo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Bit Depth</span>
              <span className="text-xs text-white">16-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
