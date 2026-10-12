import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { X, Film, Settings } from 'lucide-react';

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const RESOLUTIONS = [
  { name: '4K (3840×2160)', width: 3840, height: 2160 },
  { name: '1080p (1920×1080)', width: 1920, height: 1080 },
  { name: '720p (1280×720)', width: 1280, height: 720 },
  { name: '480p (854×480)', width: 854, height: 480 },
  { name: 'Square (1080×1080)', width: 1080, height: 1080 },
  { name: 'Portrait (1080×1920)', width: 1080, height: 1920 },
  { name: 'YouTube Shorts (1080×1920)', width: 1080, height: 1920 },
  { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
];

const FPS_OPTIONS = [24, 25, 30, 48, 50, 60];

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ isOpen, onClose }) => {
  const { project, setProjectName, setProjectResolution, setProjectFps } = useEditorStore();
  const [name, setName] = useState(project.name);
  const [width, setWidth] = useState(project.width);
  const [height, setHeight] = useState(project.height);
  const [fps, setFps] = useState(project.fps);

  if (!isOpen) return null;

  const handleSave = () => {
    setProjectName(name);
    setProjectResolution(width, height);
    setProjectFps(fps);
    onClose();
  };

  const handleResolutionChange = (res: typeof RESOLUTIONS[0]) => {
    setWidth(res.width);
    setHeight(res.height);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-purple-400" />
            <h2 className="text-white font-medium">Project Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Project Name */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a4a] rounded-lg text-sm text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Resolution Presets */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Resolution Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.name}
                  onClick={() => handleResolutionChange(res)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                    width === res.width && height === res.height
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-[#0d0d1a] border-[#2a2a4a] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a4a] rounded-lg text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a4a] rounded-lg text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* FPS */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Frame Rate</label>
            <div className="flex gap-2">
              {FPS_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                    fps === f
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-[#0d0d1a] border-[#2a2a4a] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2a2a4a]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Film size={14} />
              <span>
                {width}×{height} @ {fps}fps • 
                Estimated file size: ~{Math.round((width * height * fps * 0.1 * project.duration) / 1024 / 1024)}MB
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2a2a4a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
