import React from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  Play, Pause, SkipBack, SkipForward, Undo2, Redo2,
  Download, Settings, ZoomIn, ZoomOut
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const {
    project, currentTime, isPlaying, zoom,
    togglePlayback, setCurrentTime, setZoom,
    setProjectName, isExporting, exportProgress
  } = useEditorStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * project.fps);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleExport = async () => {
    const event = new CustomEvent('export-video');
    window.dispatchEvent(event);
  };

  const handleSettings = () => {
    const event = new CustomEvent('open-settings');
    window.dispatchEvent(event);
  };

  return (
    <div className="h-14 bg-[#1a1a2e] border-b border-[#2a2a4a] flex items-center px-4 gap-2">
      {/* Logo & Project Name */}
      <div className="flex items-center gap-3 mr-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <input
          type="text"
          value={project.name}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-white text-sm font-medium border-none outline-none w-36 hover:bg-[#2a2a4a] px-2 py-1 rounded transition-colors"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#2a2a4a]" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors" title="Redo (Ctrl+Y)">
          <Redo2 size={16} />
        </button>
      </div>

      <div className="w-px h-8 bg-[#2a2a4a]" />

      {/* Playback Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentTime(0)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
          title="Go to start (Home)"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlayback}
          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors shadow-lg shadow-purple-500/20"
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={() => setCurrentTime(project.duration)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
          title="Go to end (End)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Timecode */}
      <div className="ml-2 px-3 py-1.5 bg-[#0d0d1a] rounded-lg border border-[#2a2a4a]">
        <span className="text-green-400 font-mono text-sm">{formatTime(currentTime)}</span>
        <span className="text-gray-500 text-xs ml-2">/ {formatTime(project.duration)}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(zoom - 0.25)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-gray-400 text-xs w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(zoom + 0.25)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="w-px h-8 bg-[#2a2a4a]" />

      {/* Settings */}
      <button
        onClick={handleSettings}
        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded-lg transition-colors"
        title="Project Settings"
      >
        <Settings size={16} />
      </button>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
        title="Export Video (Ctrl+E)"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{Math.round(exportProgress)}%</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Export</span>
          </>
        )}
      </button>
    </div>
  );
};
