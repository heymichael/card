import { useRef } from 'react';
import type { TextBlock, ActiveBlock, ActiveElement, PhotoState } from './types';
import { FONT_FAMILIES } from './constants';

interface ControlsPanelProps {
  blocks: Record<string, TextBlock>;
  activeBlock: ActiveBlock;
  activeElement: ActiveElement;
  showGuides: boolean;
  photo: PhotoState | null;
  onSetActiveBlock: (id: ActiveBlock) => void;
  onSetActiveElement: (id: ActiveElement) => void;
  onUpdateBlock: (id: ActiveBlock, updates: Partial<TextBlock>) => void;
  onResetPositions: () => void;
  onToggleGuides: () => void;
  onExport: () => void;
  onAddPhoto: (file: File) => void;
  bgColor: string;
  onChangeBgColor: (color: string) => void;
}

export default function ControlsPanel({
  blocks,
  activeBlock,
  activeElement,
  showGuides,
  photo,
  onSetActiveBlock,
  onSetActiveElement,
  onUpdateBlock,
  onResetPositions,
  onToggleGuides,
  onExport,
  onAddPhoto,
  bgColor,
  onChangeBgColor,
}: ControlsPanelProps) {
  const block = blocks[activeBlock];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }
    onAddPhoto(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="controls-panel">
      <h2>Card Designer</h2>

      {/* ── Photo Section ── */}
      <div className="control-group">
        <label>Photo</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="secondary-btn photo-add-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          {photo ? 'Replace Photo' : 'Add Photo'}
        </button>
      </div>

      {/* ── Background Color ── */}
      <div className="control-group">
        <label htmlFor="bg-color-picker">Card Background</label>
        <div className="color-row">
          <input
            id="bg-color-picker"
            type="color"
            value={bgColor}
            onChange={(e) => onChangeBgColor(e.target.value)}
          />
          <span className="color-value">{bgColor}</span>
          <span
            className="bg-color-preview"
            style={{ backgroundColor: bgColor }}
          />
        </div>
      </div>

      <div className="section-divider" />

      {/* ── Text Block Section ── */}
      <div className="control-group">
        <label>Active Text Block</label>
        <div className="block-selector">
          <button
            className={activeElement === 'blockA' ? 'active' : ''}
            onClick={() => {
              onSetActiveBlock('blockA');
              onSetActiveElement('blockA');
            }}
          >
            A — Headline
          </button>
          <button
            className={activeElement === 'blockB' ? 'active' : ''}
            onClick={() => {
              onSetActiveBlock('blockB');
              onSetActiveElement('blockB');
            }}
          >
            B — Message
          </button>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="text-input">Text</label>
        <textarea
          id="text-input"
          value={block.text}
          onChange={(e) => onUpdateBlock(activeBlock, { text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="control-group">
        <label htmlFor="font-size">Font Size: {block.fontSize}px</label>
        <input
          id="font-size"
          type="range"
          min={20}
          max={200}
          value={block.fontSize}
          onChange={(e) =>
            onUpdateBlock(activeBlock, { fontSize: Number(e.target.value) })
          }
        />
        <input
          type="number"
          min={10}
          max={400}
          value={block.fontSize}
          onChange={(e) =>
            onUpdateBlock(activeBlock, { fontSize: Number(e.target.value) })
          }
          className="number-input"
        />
      </div>

      <div className="control-group">
        <label htmlFor="font-family">Font Family</label>
        <select
          id="font-family"
          value={block.fontFamily}
          onChange={(e) =>
            onUpdateBlock(activeBlock, { fontFamily: e.target.value })
          }
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="color-picker">Color</label>
        <div className="color-row">
          <input
            id="color-picker"
            type="color"
            value={block.fill}
            onChange={(e) =>
              onUpdateBlock(activeBlock, { fill: e.target.value })
            }
          />
          <span className="color-value">{block.fill}</span>
        </div>
      </div>

      <div className="control-group">
        <label>Alignment</label>
        <div className="alignment-buttons">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              className={block.align === a ? 'active' : ''}
              onClick={() => onUpdateBlock(activeBlock, { align: a })}
            >
              {a === 'left' ? '⫷' : a === 'center' ? '⫿' : '⫸'}
            </button>
          ))}
        </div>
      </div>

      <div className="section-divider" />

      <div className="control-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showGuides}
            onChange={onToggleGuides}
          />
          Show Safe Margins
        </label>
      </div>

      <div className="control-group">
        <button className="secondary-btn" onClick={onResetPositions}>
          Reset Positions
        </button>
      </div>

      <div className="control-group">
        <button className="export-btn" onClick={onExport}>
          Finish (Export JPEG)
        </button>
      </div>

      <div className="hint">
        <p>Drag blocks/photo on the card to reposition.</p>
        <p>Arrow keys nudge 1px, Shift+Arrow 10px.</p>
      </div>
    </div>
  );
}
