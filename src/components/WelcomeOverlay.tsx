import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Play, Sparkles, X, Film, Type, Layers, Download } from 'lucide-react';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ isOpen, onClose }) => {
  const createDemoProject = () => {
    const store = useEditorStore.getState();
    
    // Create sample video media
    const demoVideoId = crypto.randomUUID();
    store.addMedia({
      id: demoVideoId,
      name: 'Demo Video.mp4',
      type: 'video',
      url: '',
      duration: 10,
      width: 1920,
      height: 1080,
    });

    const demoVideoId2 = crypto.randomUUID();
    store.addMedia({
      id: demoVideoId2,
      name: 'Demo Clip 2.mp4',
      type: 'video',
      url: '',
      duration: 8,
      width: 1920,
      height: 1080,
    });

    const demoAudioId = crypto.randomUUID();
    store.addMedia({
      id: demoAudioId,
      name: 'Background Music.mp3',
      type: 'audio',
      url: '',
      duration: 20,
    });

    // Get updated tracks after media is added
    const updatedState = useEditorStore.getState();
    const videoTrack = updatedState.project.tracks.find(t => t.type === 'video');
    const audioTrack = updatedState.project.tracks.find(t => t.type === 'audio');

    if (videoTrack) {
      store.addClipToTrack(videoTrack.id, demoVideoId, 0);
      store.addClipToTrack(videoTrack.id, demoVideoId2, 10);
    }
    if (audioTrack) {
      store.addClipToTrack(audioTrack.id, demoAudioId, 0);
    }

    // Add text overlays
    store.addTextOverlay({
      text: 'Motion Studio',
      x: 50,
      y: 30,
      fontSize: 72,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'transparent',
      bold: true,
      italic: false,
      startTime: 0,
      duration: 4,
      animation: 'fadeIn',
    });

    store.addTextOverlay({
      text: 'Professional Video Editor',
      x: 50,
      y: 50,
      fontSize: 36,
      fontFamily: 'Arial',
      color: '#a855f7',
      backgroundColor: 'transparent',
      bold: false,
      italic: true,
      startTime: 1,
      duration: 5,
      animation: 'slideIn',
    });

    store.addTextOverlay({
      text: 'Created with Motion Studio',
      x: 50,
      y: 85,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      bold: false,
      italic: false,
      startTime: 14,
      duration: 4,
      animation: 'fadeIn',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-[560px] overflow-hidden shadow-2xl shadow-purple-500/10">
        {/* Header with gradient */}
        <div className="relative p-8 bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-b border-[#2a2a4a]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Motion Studio</h1>
              <p className="text-sm text-gray-400">Professional Web Video Editor</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Create stunning videos right in your browser. Import media, add effects, 
            overlay text, and export your masterpiece — all in one place.
          </p>
        </div>

        {/* Features */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-2">
            <Film size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Multi-track Timeline</p>
              <p className="text-[10px] text-gray-500">Video, audio & text tracks</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2">
            <Type size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Text & Titles</p>
              <p className="text-[10px] text-gray-500">Animated text overlays</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2">
            <Layers size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Effects & Filters</p>
              <p className="text-[10px] text-gray-500">Brightness, contrast & more</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2">
            <Download size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Export Video</p>
              <p className="text-[10px] text-gray-500">WebM format, up to 4K</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={createDemoProject}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
          >
            <Sparkles size={16} />
            Create Demo Project
          </button>
          
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0d0d1a] hover:bg-[#2a2a4a] text-gray-300 font-medium rounded-xl border border-[#2a2a4a] transition-all"
          >
            <Play size={16} />
            Start Empty Project
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <p className="text-[10px] text-gray-600 text-center">
            💡 Drag & drop video, image, or audio files anywhere to import them • Press Space to play/pause
          </p>
        </div>
      </div>
    </div>
  );
};
