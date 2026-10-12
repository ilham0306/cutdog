import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { EditorState, MediaItem, TimelineClip, TextOverlay, Track, Transition } from '../types';

interface EditorActions {
  // Playback
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  setPlaying: (playing: boolean) => void;

  // Media Library
  addMedia: (media: MediaItem) => void;
  removeMedia: (id: string) => void;

  // Tracks
  addTrack: (type: 'video' | 'audio' | 'text') => void;
  removeTrack: (id: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;

  // Clips
  addClipToTrack: (trackId: string, mediaId: string, startTime: number) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStartTime: number, newTrackId?: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  trimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  selectClip: (clipId: string | null) => void;

  // Text Overlays
  addTextOverlay: (overlay: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  selectText: (id: string | null) => void;

  // Transitions
  addTransition: (transition: Partial<Transition>) => void;
  removeTransition: (id: string) => void;

  // Project
  setProjectName: (name: string) => void;
  setProjectResolution: (width: number, height: number) => void;
  setProjectFps: (fps: number) => void;

  // UI
  setZoom: (zoom: number) => void;
  setActivePanel: (panel: 'media' | 'text' | 'effects' | 'transitions' | 'audio') => void;
  setExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number) => void;
}

const createDefaultProject = () => ({
  id: uuidv4(),
  name: 'Untitled Project',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60,
  tracks: [
    {
      id: uuidv4(),
      name: 'Video 1',
      type: 'video' as const,
      clips: [],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: uuidv4(),
      name: 'Video 2',
      type: 'video' as const,
      clips: [],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: uuidv4(),
      name: 'Audio 1',
      type: 'audio' as const,
      clips: [],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: uuidv4(),
      name: 'Text',
      type: 'text' as const,
      clips: [],
      muted: false,
      locked: false,
      visible: true,
    },
  ],
  mediaLibrary: [],
  textOverlays: [],
  transitions: [],
});

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  // Initial state
  project: createDefaultProject(),
  currentTime: 0,
  isPlaying: false,
  selectedClipId: null,
  selectedTextId: null,
  zoom: 1,
  activePanel: 'media',
  isExporting: false,
  exportProgress: 0,

  // Playback actions
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  // Media Library actions
  addMedia: (media) =>
    set((state) => ({
      project: {
        ...state.project,
        mediaLibrary: [...state.project.mediaLibrary, media],
      },
    })),
  removeMedia: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        mediaLibrary: state.project.mediaLibrary.filter((m) => m.id !== id),
      },
    })),

  // Track actions
  addTrack: (type) =>
    set((state) => {
      const trackCount = state.project.tracks.filter((t) => t.type === type).length;
      const newTrack: Track = {
        id: uuidv4(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount + 1}`,
        type,
        clips: [],
        muted: false,
        locked: false,
        visible: true,
      };
      return {
        project: {
          ...state.project,
          tracks: [...state.project.tracks, newTrack],
        },
      };
    }),
  removeTrack: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.filter((t) => t.id !== id),
      },
    })),
  toggleTrackMute: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        ),
      },
    })),
  toggleTrackLock: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, locked: !t.locked } : t
        ),
      },
    })),
  toggleTrackVisibility: (trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, visible: !t.visible } : t
        ),
      },
    })),

  // Clip actions
  addClipToTrack: (trackId, mediaId, startTime) =>
    set((state) => {
      const media = state.project.mediaLibrary.find((m) => m.id === mediaId);
      if (!media) return state;

      const newClip: TimelineClip = {
        id: uuidv4(),
        mediaId,
        trackId,
        startTime,
        duration: media.duration,
        trimStart: 0,
        trimEnd: media.duration,
        volume: 1,
        opacity: 1,
        filters: [],
      };

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((t) =>
            t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
          ),
          duration: Math.max(state.project.duration, startTime + media.duration),
        },
      };
    }),
  removeClip: (clipId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        })),
      },
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),
  moveClip: (clipId, newStartTime, newTrackId) =>
    set((state) => {
      const clip = state.project.tracks
        .flatMap((t) => t.clips)
        .find((c) => c.id === clipId);
      if (!clip) return state;

      const targetTrackId = newTrackId || clip.trackId;

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((t) => {
            if (t.id === clip.trackId && t.id !== targetTrackId) {
              return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
            }
            if (t.id === targetTrackId && t.id !== clip.trackId) {
              return {
                ...t,
                clips: [...t.clips, { ...clip, startTime: newStartTime, trackId: targetTrackId }],
              };
            }
            if (t.id === targetTrackId) {
              return {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? { ...c, startTime: newStartTime } : c
                ),
              };
            }
            return t;
          }),
        },
      };
    }),
  updateClip: (clipId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        })),
      },
    })),
  trimClip: (clipId, trimStart, trimEnd) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, trimStart, trimEnd, duration: trimEnd - trimStart }
              : c
          ),
        })),
      },
    })),
  selectClip: (clipId) => set({ selectedClipId: clipId, selectedTextId: null }),

  // Text overlay actions
  addTextOverlay: (overlay) =>
    set((state) => {
      const newText: TextOverlay = {
        id: uuidv4(),
        text: overlay.text || 'New Text',
        x: overlay.x ?? 50,
        y: overlay.y ?? 50,
        fontSize: overlay.fontSize ?? 48,
        fontFamily: overlay.fontFamily ?? 'Arial',
        color: overlay.color ?? '#ffffff',
        backgroundColor: overlay.backgroundColor ?? 'transparent',
        bold: overlay.bold ?? false,
        italic: overlay.italic ?? false,
        startTime: overlay.startTime ?? state.currentTime,
        duration: overlay.duration ?? 5,
        animation: overlay.animation ?? 'none',
      };
      return {
        project: {
          ...state.project,
          textOverlays: [...state.project.textOverlays, newText],
        },
        selectedTextId: newText.id,
      };
    }),
  removeTextOverlay: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        textOverlays: state.project.textOverlays.filter((t) => t.id !== id),
      },
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
    })),
  updateTextOverlay: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        textOverlays: state.project.textOverlays.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      },
    })),
  selectText: (id) => set({ selectedTextId: id, selectedClipId: null }),

  // Transition actions
  addTransition: (transition) =>
    set((state) => {
      const newTransition: Transition = {
        id: uuidv4(),
        type: transition.type || 'fade',
        duration: transition.duration ?? 1,
        clipId: transition.clipId || '',
      };
      return {
        project: {
          ...state.project,
          transitions: [...state.project.transitions, newTransition],
        },
      };
    }),
  removeTransition: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        transitions: state.project.transitions.filter((t) => t.id !== id),
      },
    })),

  // Project actions
  setProjectName: (name) =>
    set((state) => ({ project: { ...state.project, name } })),
  setProjectResolution: (width, height) =>
    set((state) => ({ project: { ...state.project, width, height } })),
  setProjectFps: (fps) =>
    set((state) => ({ project: { ...state.project, fps } })),

  // UI actions
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setExporting: (isExporting) => set({ isExporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
}));
