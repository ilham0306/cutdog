import { useEditorStore } from '../store/editorStore';

export const useVideoExport = () => {
  const { project, setExporting, setExportProgress, setPlaying } = useEditorStore();

  const exportVideo = async () => {
    setExporting(true);
    setExportProgress(0);
    setPlaying(false);

    try {
      // Create offscreen canvas for rendering
      const scale = Math.min(1, 1280 / project.width, 720 / project.height);
      const canvasWidth = Math.round(project.width * scale);
      const canvasHeight = Math.round(project.height * scale);
      
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d')!;

      // Setup MediaRecorder
      const stream = canvas.captureStream(project.fps);
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const exportPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });

      mediaRecorder.start(100); // Collect data every 100ms

      // Preload video elements
      const videoElements = new Map<string, HTMLVideoElement>();
      const imageElements = new Map<string, HTMLImageElement>();

      for (const media of project.mediaLibrary) {
        if (media.type === 'video') {
          const video = document.createElement('video');
          video.src = media.url;
          video.muted = true;
          video.preload = 'auto';
          await new Promise<void>((resolve) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => resolve();
            setTimeout(resolve, 3000); // Timeout after 3s
          });
          videoElements.set(media.id, video);
        } else if (media.type === 'image') {
          const img = new Image();
          img.src = media.url;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          });
          imageElements.set(media.id, img);
        }
      }

      // Render frames
      const totalFrames = Math.ceil(project.duration * project.fps);
      const frameDuration = 1 / project.fps;
      const renderBatchSize = 5; // Render multiple frames before yielding

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame * frameDuration;
        
        // Clear
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Render video/image clips
        const videoTracks = project.tracks.filter(t => t.type === 'video' && t.visible);
        
        for (let i = videoTracks.length - 1; i >= 0; i--) {
          const track = videoTracks[i];
          for (const clip of track.clips) {
            if (time >= clip.startTime && time < clip.startTime + clip.duration) {
              const media = project.mediaLibrary.find(m => m.id === clip.mediaId);
              if (!media) continue;

              ctx.save();
              ctx.globalAlpha = clip.opacity;

              // Apply filters
              let filterString = '';
              for (const filter of clip.filters) {
                switch (filter.type) {
                  case 'brightness': filterString += `brightness(${filter.value / 100}) `; break;
                  case 'contrast': filterString += `contrast(${filter.value / 100}) `; break;
                  case 'saturation': filterString += `saturate(${filter.value / 100}) `; break;
                  case 'blur': filterString += `blur(${filter.value * scale}px) `; break;
                  case 'sepia': filterString += `sepia(${filter.value / 100}) `; break;
                  case 'grayscale': filterString += `grayscale(${filter.value / 100}) `; break;
                }
              }
              ctx.filter = filterString || 'none';

              if (media.type === 'image') {
                const img = imageElements.get(media.id);
                if (img && img.complete) {
                  const imgScale = Math.max(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
                  const w = img.naturalWidth * imgScale;
                  const h = img.naturalHeight * imgScale;
                  const x = (canvasWidth - w) / 2;
                  const y = (canvasHeight - h) / 2;
                  ctx.drawImage(img, x, y, w, h);
                }
              } else if (media.type === 'video') {
                const video = videoElements.get(media.id);
                if (video) {
                  const clipTime = time - clip.startTime + clip.trimStart;
                  video.currentTime = Math.min(clipTime, video.duration - 0.01);
                  
                  // Small delay for seek
                  await new Promise(resolve => setTimeout(resolve, 10));
                  
                  if (video.readyState >= 2) {
                    const vidScale = Math.max(canvasWidth / (video.videoWidth || canvasWidth), canvasHeight / (video.videoHeight || canvasHeight));
                    const w = (video.videoWidth || canvasWidth) * vidScale;
                    const h = (video.videoHeight || canvasHeight) * vidScale;
                    const x = (canvasWidth - w) / 2;
                    const y = (canvasHeight - h) / 2;
                    ctx.drawImage(video, x, y, w, h);
                  }
                }
              }

              ctx.restore();
            }
          }
        }

        // Render text overlays
        for (const text of project.textOverlays) {
          if (time >= text.startTime && time < text.startTime + text.duration) {
            ctx.save();
            const textX = (text.x / 100) * canvasWidth;
            const textY = (text.y / 100) * canvasHeight;
            const fontSize = text.fontSize * scale;
            
            ctx.font = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${fontSize}px ${text.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let alpha = 1;
            const textProgress = (time - text.startTime) / Math.max(0.01, text.duration);
            switch (text.animation) {
              case 'fadeIn': alpha = Math.min(1, textProgress * 4); break;
              case 'slideIn': alpha = Math.min(1, textProgress * 4); break;
            }
            ctx.globalAlpha = alpha;

            if (text.backgroundColor && text.backgroundColor !== 'transparent') {
              const metrics = ctx.measureText(text.text);
              const padding = 10 * scale;
              ctx.fillStyle = text.backgroundColor;
              ctx.fillRect(
                textX - metrics.width / 2 - padding,
                textY - fontSize / 2 - padding,
                metrics.width + padding * 2,
                fontSize + padding * 2
              );
            }

            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4 * scale;
            ctx.fillStyle = text.color;
            ctx.fillText(text.text, textX, textY);
            ctx.restore();
          }
        }

        // Update progress
        setExportProgress((frame / totalFrames) * 95);

        // Yield to browser periodically
        if (frame % renderBatchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Stop recording
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
      
      const blob = await exportPromise;

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_export.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setExportProgress(100);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again or check browser console for details.');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1500);
    }
  };

  return { exportVideo };
};
