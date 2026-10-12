import React, { useRef, useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Plus, Trash2
} from 'lucide-react';

const PIXELS_PER_SECOND = 80;

export const Timeline: React.FC = () => {
  const {
    project, currentTime, zoom, selectedClipId,
    setCurrentTime, selectClip, moveClip, removeClip,
    addTrack, removeTrack, toggleTrackMute, toggleTrackLock,
    toggleTrackVisibility, trimClip, addClipToTrack
  } = useEditorStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [trimmingClip, setTrimmingClip] = useState<{ id: string; side: 'start' | 'end' } | null>(null);
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null);

  const totalWidth = project.duration * PIXELS_PER_SECOND * zoom;
  const pixelsPerSecond = PIXELS_PER_SECOND * zoom;

  // Format time for ruler
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle playhead click
  const handleRulerClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = timelineRef.current?.scrollLeft || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const time = x / pixelsPerSecond;
    setCurrentTime(Math.max(0, Math.min(time, project.duration)));
  };

  // Handle clip drag
  const handleClipMouseDown = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    selectClip(clipId);
    setDraggingClip(clipId);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingClip) {
      const clip = project.tracks.flatMap(t => t.clips).find(c => c.id === draggingClip);
      if (!clip) return;
      
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newStartTime = Math.max(0, clip.startTime + deltaTime);
      moveClip(draggingClip, newStartTime);
      setDragStartX(e.clientX);
    }
    
    if (trimmingClip) {
      const clip = project.tracks.flatMap(t => t.clips).find(c => c.id === trimmingClip.id);
      if (!clip) return;
      
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const scrollLeft = timelineRef.current?.scrollLeft || 0;
      const x = e.clientX - rect.left + scrollLeft;
      const time = x / pixelsPerSecond;
      
      if (trimmingClip.side === 'start') {
        const newTrimStart = Math.max(0, Math.min(time - clip.startTime, clip.trimEnd - 0.1));
        trimClip(clip.id, newTrimStart, clip.trimEnd);
      } else {
        const newTrimEnd = Math.max(clip.trimStart + 0.1, time - clip.startTime);
        trimClip(clip.id, clip.trimStart, newTrimEnd);
      }
    }
  }, [draggingClip, trimmingClip, pixelsPerSecond, project.tracks, moveClip, trimClip]);

  const handleMouseUp = () => {
    setDraggingClip(null);
    setTrimmingClip(null);
  };

  // Handle drop from media panel
  const handleTrackDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTrack(trackId);
  };

  const handleTrackDragLeave = () => {
    setDragOverTrack(null);
  };

  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    setDragOverTrack(null);
    
    const mediaId = e.dataTransfer.getData('text/plain');
    if (!mediaId) return;

    const media = project.mediaLibrary.find(m => m.id === mediaId);
    if (!media) return;

    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    // Validate media type matches track type
    const isValidDrop = (
      (track.type === 'video' && (media.type === 'video' || media.type === 'image')) ||
      (track.type === 'audio' && media.type === 'audio') ||
      (track.type === 'text')
    );

    if (!isValidDrop) return;
    if (track.locked) return;

    // Calculate drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = timelineRef.current?.scrollLeft || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, x / pixelsPerSecond);

    addClipToTrack(trackId, mediaId, time);
  };

  // Handle clip delete
  const handleDeleteClip = (clipId: string) => {
    removeClip(clipId);
  };

  // Get clip color based on media type
  const getClipColor = (clipId: string) => {
    const clip = project.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
    if (!clip) return 'from-blue-600 to-blue-800';
    const media = project.mediaLibrary.find(m => m.id === clip.mediaId);
    if (!media) return 'from-gray-600 to-gray-800';
    switch (media.type) {
      case 'video': return 'from-purple-600 to-purple-800';
      case 'image': return 'from-blue-600 to-blue-800';
      case 'audio': return 'from-green-600 to-green-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  // Generate ruler marks
  const rulerMarks = [];
  const interval = zoom >= 2 ? 1 : zoom >= 1 ? 2 : zoom >= 0.5 ? 5 : 10;
  for (let t = 0; t <= project.duration; t += interval) {
    rulerMarks.push(t);
  }

  return (
    <div className="h-[256px] bg-[#12121f] border-t border-[#2a2a4a] flex flex-col">
      {/* Timeline Toolbar */}
      <div className="h-10 flex items-center px-3 gap-2 bg-[#1a1a2e] border-b border-[#2a2a4a]">
        <button
          onClick={() => addTrack('video')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded transition-colors"
        >
          <Plus size={12} /> Video
        </button>
        <button
          onClick={() => addTrack('audio')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded transition-colors"
        >
          <Plus size={12} /> Audio
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500">
          {project.tracks.length} tracks • {project.tracks.flatMap(t => t.clips).length} clips
        </span>
        {selectedClipId && (
          <>
            <div className="w-px h-5 bg-[#2a2a4a]" />
            <button
              onClick={() => handleDeleteClip(selectedClipId)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="flex-shrink-0 w-[160px] border-r border-[#2a2a4a] overflow-y-auto">
          {/* Ruler header */}
          <div className="h-6 border-b border-[#2a2a4a] bg-[#1a1a2e] flex items-center px-2">
            <span className="text-[10px] text-gray-500">Tracks</span>
          </div>
          
          {/* Track headers */}
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className="h-[60px] flex items-center px-2 border-b border-[#2a2a4a] gap-1"
              style={{ opacity: track.visible ? 1 : 0.5 }}
            >
              {/* Track type indicator */}
              <div className={`w-1 h-8 rounded-full ${
                track.type === 'video' ? 'bg-purple-500' :
                track.type === 'audio' ? 'bg-green-500' :
                'bg-yellow-500'
              }`} />
              
              <span className="text-xs text-gray-300 flex-1 truncate">{track.name}</span>
              <button
                onClick={() => toggleTrackMute(track.id)}
                className="p-1 text-gray-500 hover:text-white rounded transition-colors"
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <button
                onClick={() => toggleTrackVisibility(track.id)}
                className="p-1 text-gray-500 hover:text-white rounded transition-colors"
                title={track.visible ? 'Hide' : 'Show'}
              >
                {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button
                onClick={() => toggleTrackLock(track.id)}
                className="p-1 text-gray-500 hover:text-white rounded transition-colors"
                title={track.locked ? 'Unlock' : 'Lock'}
              >
                {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          ))}
        </div>

        {/* Timeline Tracks */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ width: totalWidth, minHeight: '100%' }}>
            {/* Ruler */}
            <div
              className="h-6 border-b border-[#2a2a4a] bg-[#1a1a2e] relative cursor-pointer"
              onClick={handleRulerClick}
            >
              {rulerMarks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full flex flex-col justify-end"
                  style={{ left: t * pixelsPerSecond }}
                >
                  <div className="w-px h-3 bg-gray-600" />
                  <span className="text-[10px] text-gray-500 ml-1 whitespace-nowrap">{formatTime(t)}</span>
                </div>
              ))}
              
              {/* Current time indicator on ruler */}
              <div
                className="absolute bottom-0 w-2 h-2 bg-red-500 rounded-full -ml-1"
                style={{ left: currentTime * pixelsPerSecond }}
              />
            </div>

            {/* Playhead */}
            <div
              className="absolute top-6 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
              style={{ left: currentTime * pixelsPerSecond }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500" />
              </div>
            </div>

            {/* Tracks */}
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className={`h-[60px] border-b border-[#2a2a4a] relative transition-colors ${
                  dragOverTrack === track.id ? 'bg-purple-900/10' : ''
                }`}
                onDragOver={(e) => handleTrackDragOver(e, track.id)}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, track.id)}
              >
                {/* Track background grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.3) 19px, rgba(255,255,255,0.3) 20px)',
                  backgroundSize: `${pixelsPerSecond}px 100%`
                }} />

                {/* Clips */}
                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={`absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all
                      bg-gradient-to-r ${getClipColor(clip.id)}
                      ${selectedClipId === clip.id ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/20 z-10' : 'hover:ring-1 hover:ring-white/30 hover:shadow-md'}
                      ${track.locked ? 'cursor-not-allowed opacity-70' : ''}
                      ${draggingClip === clip.id ? 'opacity-70 scale-[1.02]' : ''}
                    `}
                    style={{
                      left: clip.startTime * pixelsPerSecond,
                      width: Math.max(clip.duration * pixelsPerSecond, 20),
                    }}
                    onMouseDown={(e) => !track.locked && handleClipMouseDown(e, clip.id)}
                  >
                    {/* Clip content */}
                    <div className="h-full px-2 flex items-center overflow-hidden">
                      <span className="text-white text-[11px] font-medium truncate drop-shadow-sm">
                        {project.mediaLibrary.find(m => m.id === clip.mediaId)?.name || 'Clip'}
                      </span>
                    </div>

                    {/* Clip duration label */}
                    {clip.duration * pixelsPerSecond > 60 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] text-white/50">
                        {clip.duration.toFixed(1)}s
                      </span>
                    )}

                    {/* Trim handles */}
                    {!track.locked && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-l-lg transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClip({ id: clip.id, side: 'start' });
                          }}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-r-lg transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClip({ id: clip.id, side: 'end' });
                          }}
                        />
                      </>
                    )}

                    {/* Waveform for audio */}
                    {track.type === 'audio' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none overflow-hidden">
                        <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
                          <path
                            d="M0,20 Q5,8 10,20 Q15,32 20,20 Q25,10 30,20 Q35,30 40,20 Q45,12 50,20 Q55,28 60,20 Q65,8 70,20 Q75,32 80,20 Q85,14 90,20 Q95,26 100,20 Q105,10 110,20 Q115,30 120,20 Q125,12 130,20 Q135,28 140,20 Q145,8 150,20 Q155,32 160,20 Q165,14 170,20 Q175,26 180,20 Q185,10 190,20 Q195,30 200,20"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {/* Text overlays on timeline */}
                {track.type === 'text' && project.textOverlays.map((text) => (
                  <div
                    key={text.id}
                    className={`absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all
                      bg-gradient-to-r from-yellow-600 to-orange-600
                      ${useEditorStore.getState().selectedTextId === text.id ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20 z-10' : 'hover:ring-1 hover:ring-white/30'}
                    `}
                    style={{
                      left: text.startTime * pixelsPerSecond,
                      width: Math.max(text.duration * pixelsPerSecond, 20),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      useEditorStore.getState().selectText(text.id);
                    }}
                  >
                    <div className="h-full px-2 flex items-center overflow-hidden">
                      <span className="text-white text-[11px] font-medium truncate">
                        T: {text.text}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Drop indicator */}
                {dragOverTrack === track.id && (
                  <div className="absolute inset-0 border-2 border-dashed border-purple-500/50 rounded pointer-events-none flex items-center justify-center">
                    <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded">
                      Drop here
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
