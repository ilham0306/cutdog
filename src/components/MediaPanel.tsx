import React, { useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Upload, Film, Image, Music, Trash2, Plus, Search, GripVertical } from 'lucide-react';

export const MediaPanel: React.FC = () => {
  const { project, addMedia, removeMedia, addClipToTrack } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
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
          addMedia({
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
          addMedia({
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
          addMedia({
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

  const handleAddToTimeline = (mediaId: string) => {
    const media = project.mediaLibrary.find(m => m.id === mediaId);
    if (!media) return;

    let targetTrack;
    if (media.type === 'video' || media.type === 'image') {
      targetTrack = project.tracks.find(t => t.type === 'video');
    } else if (media.type === 'audio') {
      targetTrack = project.tracks.find(t => t.type === 'audio');
    }

    if (targetTrack) {
      const lastClipEnd = targetTrack.clips.reduce((max, clip) => 
        Math.max(max, clip.startTime + clip.duration), 0
      );
      addClipToTrack(targetTrack.id, mediaId, lastClipEnd);
    }
  };

  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
    setDraggedMediaId(mediaId);
    e.dataTransfer.setData('text/plain', mediaId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedMediaId(null);
  };

  const filteredMedia = project.mediaLibrary.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film size={14} className="text-purple-400" />;
      case 'image': return <Image size={14} className="text-blue-400" />;
      case 'audio': return <Music size={14} className="text-green-400" />;
      default: return null;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-purple-500/20 text-purple-300';
      case 'image': return 'bg-blue-500/20 text-blue-300';
      case 'audio': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-medium">Media Library</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <Upload size={12} /> Import
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Search */}
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media..."
            className="w-full pl-7 pr-2 py-1.5 bg-[#0d0d1a] border border-[#2a2a4a] rounded-lg text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'video', 'image', 'audio'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                filterType === type
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a4a]'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Media List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-[#1a1a2e] rounded-2xl flex items-center justify-center mb-3 border border-[#2a2a4a]">
              <Upload size={24} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-xs mb-1">No media imported</p>
            <p className="text-gray-500 text-[10px]">Click Import or drag files to this window</p>
            <div className="mt-4 px-3 py-2 bg-[#0d0d1a] rounded-lg border border-dashed border-[#2a2a4a]">
              <p className="text-[10px] text-gray-500">
                Supports: MP4, WebM, MOV, PNG, JPG, MP3, WAV
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMedia.map(media => (
              <div
                key={media.id}
                draggable
                onDragStart={(e) => handleDragStart(e, media.id)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                  draggedMediaId === media.id
                    ? 'bg-purple-900/30 border-purple-500/50 opacity-50'
                    : 'hover:bg-[#1a1a2e] border-transparent hover:border-[#2a2a4a]'
                }`}
                onDoubleClick={() => handleAddToTimeline(media.id)}
              >
                {/* Drag Handle */}
                <GripVertical size={12} className="text-gray-600 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-12 h-8 rounded bg-[#0d0d1a] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#2a2a4a]">
                  {media.type === 'image' ? (
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      {getTypeIcon(media.type)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{media.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1 py-0.5 rounded ${getTypeBadgeColor(media.type)}`}>
                      {media.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatDuration(media.duration)}
                    </span>
                    {media.width && media.height && (
                      <span className="text-[10px] text-gray-500">
                        {media.width}×{media.height}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToTimeline(media.id); }}
                    className="p-1.5 text-gray-400 hover:text-purple-400 rounded transition-colors hover:bg-purple-900/20"
                    title="Add to timeline"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors hover:bg-red-900/20"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop zone hint */}
      <div className="p-2 border-t border-[#2a2a4a] bg-[#0d0d1a]">
        <p className="text-[10px] text-gray-500 text-center">
          💡 Drag media to timeline • Double-click to add
        </p>
      </div>
    </div>
  );
};
