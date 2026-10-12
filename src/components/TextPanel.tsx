import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Type, Bold, Italic, Trash2, Plus, AlignLeft, AlignCenter } from 'lucide-react';

const FONTS = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact', 'Comic Sans MS'];
const COLORS = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
const ANIMATIONS = ['none', 'fadeIn', 'slideIn', 'typewriter'] as const;

export const TextPanel: React.FC = () => {
  const { project, addTextOverlay, removeTextOverlay, updateTextOverlay, selectedTextId, selectText } = useEditorStore();
  
  const selectedText = project.textOverlays.find(t => t.id === selectedTextId);

  const handleAddText = () => {
    addTextOverlay({
      text: 'New Text',
      x: 50,
      y: 50,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'transparent',
      bold: false,
      italic: false,
      startTime: useEditorStore.getState().currentTime,
      duration: 5,
      animation: 'none',
    });
  };

  const handleAddPreset = (preset: string) => {
    const presets: Record<string, Partial<any>> = {
      title: { text: 'Title Text', fontSize: 72, bold: true, color: '#ffffff', y: 30, animation: 'fadeIn' },
      subtitle: { text: 'Subtitle', fontSize: 36, bold: false, color: '#cccccc', y: 70, animation: 'fadeIn' },
      lower: { text: 'Lower Third', fontSize: 28, bold: true, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)', x: 20, y: 80, animation: 'slideIn' },
      caption: { text: 'Caption text here', fontSize: 24, bold: false, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', y: 85 },
    };
    addTextOverlay({
      startTime: useEditorStore.getState().currentTime,
      duration: 5,
      ...presets[preset],
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-medium flex items-center gap-2">
            <Type size={14} /> Text
          </h3>
          <button
            onClick={handleAddText}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="p-3 border-b border-[#2a2a4a]">
        <p className="text-xs text-gray-400 mb-2">Quick Presets</p>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleAddPreset('title')}
            className="px-2 py-2 text-xs text-gray-300 bg-[#0d0d1a] hover:bg-[#2a2a4a] rounded border border-[#2a2a4a] transition-colors"
          >
            Title
          </button>
          <button
            onClick={() => handleAddPreset('subtitle')}
            className="px-2 py-2 text-xs text-gray-300 bg-[#0d0d1a] hover:bg-[#2a2a4a] rounded border border-[#2a2a4a] transition-colors"
          >
            Subtitle
          </button>
          <button
            onClick={() => handleAddPreset('lower')}
            className="px-2 py-2 text-xs text-gray-300 bg-[#0d0d1a] hover:bg-[#2a2a4a] rounded border border-[#2a2a4a] transition-colors"
          >
            Lower Third
          </button>
          <button
            onClick={() => handleAddPreset('caption')}
            className="px-2 py-2 text-xs text-gray-300 bg-[#0d0d1a] hover:bg-[#2a2a4a] rounded border border-[#2a2a4a] transition-colors"
          >
            Caption
          </button>
        </div>
      </div>

      {/* Text List */}
      <div className="flex-1 overflow-y-auto p-2">
        {project.textOverlays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-gray-500 text-xs">No text overlays</p>
            <p className="text-gray-600 text-xs">Add text or use a preset</p>
          </div>
        ) : (
          <div className="space-y-1">
            {project.textOverlays.map(text => (
              <div
                key={text.id}
                onClick={() => selectText(text.id)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedTextId === text.id
                    ? 'bg-purple-900/30 border border-purple-500/50'
                    : 'hover:bg-[#1a1a2e] border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{text.text}</p>
                  <p className="text-[10px] text-gray-500">
                    {text.startTime.toFixed(1)}s — {(text.startTime + text.duration).toFixed(1)}s
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeTextOverlay(text.id); }}
                  className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties */}
      {selectedText && (
        <div className="border-t border-[#2a2a4a] p-3 space-y-3 max-h-[300px] overflow-y-auto">
          <h4 className="text-xs text-gray-400 font-medium">Properties</h4>
          
          {/* Text Content */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Text</label>
            <textarea
              value={selectedText.text}
              onChange={(e) => updateTextOverlay(selectedText.id, { text: e.target.value })}
              className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500 resize-none h-16"
            />
          </div>

          {/* Font */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Font</label>
            <select
              value={selectedText.fontFamily}
              onChange={(e) => updateTextOverlay(selectedText.id, { fontFamily: e.target.value })}
              className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Size: {selectedText.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="120"
              value={selectedText.fontSize}
              onChange={(e) => updateTextOverlay(selectedText.id, { fontSize: Number(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Style */}
          <div className="flex gap-1">
            <button
              onClick={() => updateTextOverlay(selectedText.id, { bold: !selectedText.bold })}
              className={`p-1.5 rounded transition-colors ${selectedText.bold ? 'bg-purple-600 text-white' : 'bg-[#0d0d1a] text-gray-400 hover:text-white'}`}
            >
              <Bold size={12} />
            </button>
            <button
              onClick={() => updateTextOverlay(selectedText.id, { italic: !selectedText.italic })}
              className={`p-1.5 rounded transition-colors ${selectedText.italic ? 'bg-purple-600 text-white' : 'bg-[#0d0d1a] text-gray-400 hover:text-white'}`}
            >
              <Italic size={12} />
            </button>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Color</label>
            <div className="flex flex-wrap gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateTextOverlay(selectedText.id, { color })}
                  className={`w-5 h-5 rounded border-2 transition-all ${
                    selectedText.color === color ? 'border-purple-400 scale-110' : 'border-[#2a2a4a]'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">X: {Math.round(selectedText.x)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedText.x}
                onChange={(e) => updateTextOverlay(selectedText.id, { x: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Y: {Math.round(selectedText.y)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedText.y}
                onChange={(e) => updateTextOverlay(selectedText.id, { y: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Start (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={selectedText.startTime}
                onChange={(e) => updateTextOverlay(selectedText.id, { startTime: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Duration (s)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={selectedText.duration}
                onChange={(e) => updateTextOverlay(selectedText.id, { duration: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Animation</label>
            <select
              value={selectedText.animation}
              onChange={(e) => updateTextOverlay(selectedText.id, { animation: e.target.value as any })}
              className="w-full px-2 py-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded text-xs text-white outline-none focus:border-purple-500"
            >
              {ANIMATIONS.map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
