export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  duration: number;
  width?: number;
  height?: number;
  file?: File;
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  opacity: number;
  filters: ClipFilter[];
}

export interface ClipFilter {
  id: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale';
  value: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  startTime: number;
  duration: number;
  animation?: 'none' | 'fadeIn' | 'slideIn' | 'typewriter';
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
  clipId: string;
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  tracks: Track[];
  mediaLibrary: MediaItem[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
}

export interface EditorState {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTextId: string | null;
  zoom: number;
  activePanel: 'media' | 'text' | 'effects' | 'transitions' | 'audio';
  isExporting: boolean;
  exportProgress: number;
}
