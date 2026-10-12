import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Sliders, Sparkles, Volume2 } from 'lucide-react';

export const EffectsPanel: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();
  
  const selectedClip = project.tracks
    .flatMap(t => t.clips)
    .find(c => c.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-[#2a2a4a]">
          <h3 className="text-white text-sm font-medium flex items-center gap-2">
            <Sliders size={14} /> Properties
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Sliders size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">Select a clip to edit properties</p>
          </div>
        </div>
      </div>
    );
  }

  const media = project.mediaLibrary.find(m => m.id === selectedClip.mediaId);

  const getFilterValue = (type: string) => {
    const filter = selectedClip.filters.find(f => f.type === type);
    return filter?.value ?? (type === 'brightness' || type === 'contrast' || type === 'saturation' ? 100 : 0);
  };

  const setFilter = (type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale', value: number) => {
    const existingFilters = selectedClip.filters.filter(f => f.type !== type);
    if (value !== (type === 'brightness' || type === 'contrast' || type === 'saturation' ? 100 : 0)) {
      existingFilters.push({ id: crypto.randomUUID(), type, value });
    }
    updateClip(selectedClip.id, { filters: existingFilters });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h3 className="text-white text-sm font-medium flex items-center gap-2">
          <Sliders size={14} /> Properties
        </h3>
        {media && (
          <p className="text-[10px] text-gray-500 mt-1 truncate">{media.name}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Opacity */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">
            Opacity: {Math.round(selectedClip.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedClip.opacity * 100}
            onChange={(e) => updateClip(selectedClip.id, { opacity: Number(e.target.value) / 100 })}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
            <Volume2 size={10} /> Volume: {Math.round(selectedClip.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={selectedClip.volume * 100}
            onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) / 100 })}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a4a]" />

        {/* Filters */}
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
            <Sparkles size={12} /> Filters
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Brightness: {getFilterValue('brightness')}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={getFilterValue('brightness')}
                onChange={(e) => setFilter('brightness', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Contrast: {getFilterValue('contrast')}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={getFilterValue('contrast')}
                onChange={(e) => setFilter('contrast', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Saturation: {getFilterValue('saturation')}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={getFilterValue('saturation')}
                onChange={(e) => setFilter('saturation', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Blur: {getFilterValue('blur')}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={getFilterValue('blur')}
                onChange={(e) => setFilter('blur', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Sepia: {getFilterValue('sepia')}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={getFilterValue('sepia')}
                onChange={(e) => setFilter('sepia', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Grayscale: {getFilterValue('grayscale')}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={getFilterValue('grayscale')}
                onChange={(e) => setFilter('grayscale', Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="border-t border-[#2a2a4a] pt-3">
          <h4 className="text-xs text-gray-400 font-medium mb-2">Timing</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Start (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={selectedClip.startTime}
                onChange={(e) => updateClip(selectedClip.id, { startTime: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Duration (s)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={selectedClip.duration}
                onChange={(e) => updateClip(selectedClip.id, { duration: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => updateClip(selectedClip.id, { 
            opacity: 1, volume: 1, filters: [] 
          })}
          className="w-full py-2 text-xs text-gray-400 hover:text-white bg-[#0d0d1a] hover:bg-[#2a2a4a] border border-[#2a2a4a] rounded transition-colors"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};
