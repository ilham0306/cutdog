import React, { useEffect, useCallback, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Preview } from './components/Preview';
import { Timeline } from './components/Timeline';
import { SidePanel } from './components/SidePanel';
import { ProjectSettings } from './components/ProjectSettings';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { useEditorStore } from './store/editorStore';
import { useVideoExport } from './hooks/useVideoExport';

function App() {
  const { project } = useEditorStore();
  const { exportVideo } = useVideoExport();
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Handle export event
  useEffect(() => {
    const handleExport = () => exportVideo();
    window.addEventListener('export-video', handleExport);
    return () => window.removeEventListener('export-video', handleExport);
  }, [exportVideo]);

  // Handle settings event
  useEffect(() => {
    const handleSettings = () => setShowSettings(true);
    window.addEventListener('open-settings', handleSettings);
    return () => window.removeEventListener('open-settings', handleSettings);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const state = useEditorStore.getState();
    const target = e.target as HTMLElement;
    
    // Don't handle shortcuts when typing in inputs
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }
    
    // Space - toggle playback
    if (e.code === 'Space') {
      e.preventDefault();
      state.togglePlayback();
    }
    
    // Delete - remove selected clip/text
    if (e.code === 'Delete' || e.code === 'Backspace') {
      if (state.selectedClipId) {
        state.removeClip(state.selectedClipId);
      } else if (state.selectedTextId) {
        state.removeTextOverlay(state.selectedTextId);
      }
    }

    // Left/Right arrows - seek
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      state.setCurrentTime(Math.max(0, state.currentTime - (e.shiftKey ? 5 : 1 / state.project.fps)));
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      state.setCurrentTime(Math.min(state.project.duration, state.currentTime + (e.shiftKey ? 5 : 1 / state.project.fps)));
    }

    // Home/End
    if (e.code === 'Home') {
      state.setCurrentTime(0);
    }
    if (e.code === 'End') {
      state.setCurrentTime(state.project.duration);
    }

    // Ctrl+S - save
    if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const projectData = { project: state.project };
      localStorage.setItem('motion-studio-project', JSON.stringify(projectData));
    }

    // Ctrl+E - export
    if (e.code === 'KeyE' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      exportVideo();
    }

    // Escape - deselect
    if (e.code === 'Escape') {
      state.selectClip(null);
      state.selectText(null);
    }

    // +/- zoom
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      state.setZoom(state.zoom + 0.25);
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      state.setZoom(state.zoom - 0.25);
    }
  }, [exportVideo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle global drag & drop for importing media
  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    const store = useEditorStore.getState();
    store.setActivePanel('media');
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' :
                   file.type.startsWith('image') ? 'image' :
                   file.type.startsWith('audio') ? 'audio' : null;
      if (!type) return;

      if (type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => {
          store.addMedia({
            id: crypto.randomUUID(),
            name: file.name,
            type: 'video',
            url,
            duration: video.duration || 10,
            width: video.videoWidth,
            height: video.videoHeight,
            file,
          });
        };
      } else if (type === 'image') {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          store.addMedia({
            id: crypto.randomUUID(),
            name: file.name,
            type: 'image',
            url,
            duration: 5,
            width: img.width,
            height: img.height,
            file,
          });
        };
      } else if (type === 'audio') {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = url;
        audio.onloadedmetadata = () => {
          store.addMedia({
            id: crypto.randomUUID(),
            name: file.name,
            type: 'audio',
            url,
            duration: audio.duration || 30,
            file,
          });
        };
      }
    });
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#0d0d1a] overflow-hidden select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
    >
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Panel */}
        <SidePanel />

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Preview />
        </div>
      </div>

      {/* Bottom Timeline */}
      <Timeline />

      {/* Status Bar */}
      <div className="h-6 bg-[#0d0d1a] border-t border-[#2a2a4a] flex items-center px-3 gap-4">
        <span className="text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 bg-[#1a1a2e] rounded text-[9px] border border-[#2a2a4a]">Space</kbd> Play/Pause
        </span>
        <span className="text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 bg-[#1a1a2e] rounded text-[9px] border border-[#2a2a4a]">←→</kbd> Seek
        </span>
        <span className="text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 bg-[#1a1a2e] rounded text-[9px] border border-[#2a2a4a]">Del</kbd> Delete
        </span>
        <span className="text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 bg-[#1a1a2e] rounded text-[9px] border border-[#2a2a4a]">+/-</kbd> Zoom
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500">
          {project.width}×{project.height} • {project.fps}fps
        </span>
        <span className="text-[10px] text-gray-600">|</span>
        <span className="text-[10px] text-gray-500">Motion Studio v1.0</span>
      </div>

      {/* Modals */}
      <ProjectSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <WelcomeOverlay isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  );
}

export default App;
