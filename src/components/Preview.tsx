import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Monitor, Maximize2, Grid3x3 } from 'lucide-react';

// Cache for video elements
const videoCache = new Map<string, HTMLVideoElement>();

const getVideoElement = (url: string): HTMLVideoElement => {
  if (!videoCache.has(url)) {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    videoCache.set(url, video);
  }
  return videoCache.get(url)!;
};

const imageCache = new Map<string, HTMLImageElement>();

const getImageElement = (url: string): HTMLImageElement => {
  if (!imageCache.has(url)) {
    const img = new Image();
    img.src = url;
    img.crossOrigin = 'anonymous';
    imageCache.set(url, img);
  }
  return imageCache.get(url)!;
};

export const Preview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    project, currentTime, isPlaying, setCurrentTime, setPlaying,
    selectedTextId
  } = useEditorStore();

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Render frame at given time
  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let hasContent = false;

    // Render video/image clips at current time (reverse order for layering)
    const videoTracks = project.tracks.filter(t => t.type === 'video' && t.visible);
    
    for (let i = videoTracks.length - 1; i >= 0; i--) {
      const track = videoTracks[i];
      for (const clip of track.clips) {
        if (time >= clip.startTime && time < clip.startTime + clip.duration) {
          const media = project.mediaLibrary.find(m => m.id === clip.mediaId);
          if (!media) continue;

          hasContent = true;
          ctx.save();
          ctx.globalAlpha = clip.opacity;
          
          // Apply filters
          let filterString = '';
          for (const filter of clip.filters) {
            switch (filter.type) {
              case 'brightness': filterString += `brightness(${filter.value / 100}) `; break;
              case 'contrast': filterString += `contrast(${filter.value / 100}) `; break;
              case 'saturation': filterString += `saturate(${filter.value / 100}) `; break;
              case 'blur': filterString += `blur(${filter.value}px) `; break;
              case 'sepia': filterString += `sepia(${filter.value / 100}) `; break;
              case 'grayscale': filterString += `grayscale(${filter.value / 100}) `; break;
            }
          }
          ctx.filter = filterString || 'none';

          if (media.type === 'image') {
            const img = getImageElement(media.url);
            if (img.complete && img.naturalWidth > 0) {
              // Cover fit
              const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
              const w = img.naturalWidth * scale;
              const h = img.naturalHeight * scale;
              const x = (canvas.width - w) / 2;
              const y = (canvas.height - h) / 2;
              ctx.drawImage(img, x, y, w, h);
            }
          } else if (media.type === 'video') {
            const video = getVideoElement(media.url);
            const clipTime = time - clip.startTime + clip.trimStart;
            
            // Seek video to correct time
            if (Math.abs(video.currentTime - clipTime) > 0.1) {
              video.currentTime = clipTime;
            }
            
            if (video.readyState >= 2) {
              // Draw video frame (cover fit)
              const scale = Math.max(canvas.width / (video.videoWidth || canvas.width), canvas.height / (video.videoHeight || canvas.height));
              const w = (video.videoWidth || canvas.width) * scale;
              const h = (video.videoHeight || canvas.height) * scale;
              const x = (canvas.width - w) / 2;
              const y = (canvas.height - h) / 2;
              ctx.drawImage(video, x, y, w, h);
            } else {
              // Fallback: gradient placeholder
              const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
              const hue = (parseInt(clip.mediaId.slice(0, 8), 16) % 360);
              gradient.addColorStop(0, `hsl(${hue}, 60%, 30%)`);
              gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 60%, 20%)`);
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.filter = 'none';
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`Loading: ${media.name}`, canvas.width / 2, canvas.height / 2);
            }
          }

          ctx.restore();
        }
      }
    }

    // Render text overlays
    for (const text of project.textOverlays) {
      if (time >= text.startTime && time < text.startTime + text.duration) {
        hasContent = true;
        ctx.save();
        
        const scaleX = canvas.width / 1920;
        const scaleY = canvas.height / 1080;
        const textX = (text.x / 100) * canvas.width;
        const textY = (text.y / 100) * canvas.height;
        const fontSize = text.fontSize * Math.min(scaleX, scaleY);
        
        ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${fontSize}px ${text.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Animation
        let alpha = 1;
        let offsetX = 0;
        const textProgress = (time - text.startTime) / Math.max(0.01, text.duration);
        const displayText = text.text;
        
        switch (text.animation) {
          case 'fadeIn':
            alpha = Math.min(1, textProgress * 4);
            break;
          case 'slideIn':
            offsetX = Math.max(0, (1 - textProgress * 4)) * 200 * scaleX;
            alpha = Math.min(1, textProgress * 4);
            break;
          case 'typewriter':
            const charsToShow = Math.floor(displayText.length * Math.min(1, textProgress * 3));
            ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${fontSize}px ${text.fontFamily}`;
            break;
        }

        ctx.globalAlpha = alpha;

        // Background
        if (text.backgroundColor && text.backgroundColor !== 'transparent') {
          const metrics = ctx.measureText(displayText);
          const padding = 12 * scaleX;
          ctx.fillStyle = text.backgroundColor;
          const bgX = textX - metrics.width / 2 - padding + offsetX;
          const bgY = textY - fontSize / 2 - padding / 2;
          const bgW = metrics.width + padding * 2;
          const bgH = fontSize + padding;
          // Rounded rect
          const radius = 4 * scaleX;
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgW - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
          ctx.lineTo(bgX + bgW, bgY + bgH - radius);
          ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
          ctx.lineTo(bgX + radius, bgY + bgH);
          ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();
        }

        // Text shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4 * scaleX;
        ctx.shadowOffsetX = 2 * scaleX;
        ctx.shadowOffsetY = 2 * scaleX;

        // Text
        ctx.fillStyle = text.color;
        ctx.fillText(displayText, textX + offsetX, textY);

        // Selection indicator
        if (selectedTextId === text.id) {
          ctx.shadowColor = 'transparent';
          const metrics = ctx.measureText(displayText);
          const padding = 8 * scaleX;
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            textX - metrics.width / 2 - padding + offsetX,
            textY - fontSize / 2 - padding,
            metrics.width + padding * 2,
            fontSize + padding * 2
          );
          // Corner handles
          ctx.setLineDash([]);
          const handleSize = 6;
          const corners = [
            [textX - metrics.width / 2 - padding + offsetX, textY - fontSize / 2 - padding],
            [textX + metrics.width / 2 + padding + offsetX, textY - fontSize / 2 - padding],
            [textX - metrics.width / 2 - padding + offsetX, textY + fontSize / 2 + padding],
            [textX + metrics.width / 2 + padding + offsetX, textY + fontSize / 2 + padding],
          ];
          ctx.fillStyle = '#a855f7';
          corners.forEach(([cx, cy]) => {
            ctx.fillRect(cx - handleSize/2, cy - handleSize/2, handleSize, handleSize);
          });
        }

        ctx.restore();
      }
    }

    // If nothing to render, show empty state
    if (!hasContent) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Import media to get started', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillText('Drag & drop files or use the Media panel', canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [project, selectedTextId]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const state = useEditorStore.getState();
      
      if (state.isPlaying) {
        const newTime = state.currentTime + delta;
        if (newTime >= state.project.duration) {
          state.setPlaying(false);
          state.setCurrentTime(0);
        } else {
          state.setCurrentTime(newTime);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderFrame(ctx, canvas, useEditorStore.getState().currentTime);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [renderFrame]);

  // Handle canvas click for text selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Check if clicked on a text overlay
    const time = useEditorStore.getState().currentTime;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clickedText = null;
    for (const text of [...project.textOverlays].reverse()) {
      if (time < text.startTime || time >= text.startTime + text.duration) continue;
      
      const textX = (text.x / 100) * canvas.width;
      const textY = (text.y / 100) * canvas.height;
      const fontSize = text.fontSize * Math.min(canvas.width / 1920, canvas.height / 1080);
      
      ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${fontSize}px ${text.fontFamily}`;
      const metrics = ctx.measureText(text.text);
      const padding = 8;
      
      if (
        canvasX >= textX - metrics.width / 2 - padding &&
        canvasX <= textX + metrics.width / 2 + padding &&
        canvasY >= textY - fontSize / 2 - padding &&
        canvasY <= textY + fontSize / 2 + padding
      ) {
        clickedText = text;
        break;
      }
    }

    if (clickedText) {
      useEditorStore.getState().selectText(clickedText.id);
    } else {
      useEditorStore.getState().selectText(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d1a]">
      {/* Preview Header */}
      <div className="h-10 flex items-center justify-between px-4 bg-[#1a1a2e] border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-gray-400 text-xs">
            Preview — {project.width}×{project.height} @ {project.fps}fps
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded transition-colors">
            <Grid3x3 size={14} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a4a] rounded transition-colors">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#0a0a15]">
        <div 
          className="relative shadow-2xl" 
          style={{ 
            aspectRatio: `${project.width}/${project.height}`, 
            maxHeight: 'calc(100vh - 420px)',
            maxWidth: '100%' 
          }}
        >
          <canvas
            ref={canvasRef}
            width={project.width > 1920 ? 1280 : project.width}
            height={project.height > 1080 ? 720 : project.height}
            onClick={handleCanvasClick}
            className="w-full h-full rounded-lg border border-[#2a2a4a] cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
};
