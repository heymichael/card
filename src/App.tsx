import { useState, useRef, useCallback, useEffect } from 'react';
import { GlobalNav } from '@haderach/shared-ui';
import ControlsPanel from './ControlsPanel';
import CardCanvas from './CardCanvas';
import { useAuthUser } from './auth/AuthUserContext';
import type { CardCanvasHandle } from './CardCanvas';
import type { TextBlock, ActiveBlock, ActiveElement, PhotoState } from './types';
import { CARD_WIDTH, CARD_HEIGHT } from './constants';
import { COLOR_TOKENS } from './theme/colors';
import {
  trackPhotoAdded,
  trackPhotoRemoved,
  trackBgColorChanged,
  trackHeadlineTextEdited,
  trackMessageTextEdited,
  trackFontSizeChanged,
  trackFontFamilyChanged,
  trackTextColorChanged,
  trackTextAlignmentChanged,
  trackElementRepositioned,
  trackPhotoResized,
  trackSafeMarginsToggled,
  trackPositionsReset,
  trackTextBlockSwitched,
  trackCardExported,
  trackCardConversion,
} from './analytics/analytics';
import './App.css';

const DEFAULT_BLOCKS: Record<string, TextBlock> = {
  blockA: {
    id: 'blockA',
    label: 'Headline',
    text: 'Happy Birthday!',
    x: 200,
    y: 700,
    fontSize: 120,
    fontFamily: 'Georgia',
    fill: COLOR_TOKENS.cardTextHeadlineDefault,
    align: 'center',
    width: 1100,
    curved: true,              // Headline starts with curve enabled
    curveType: 'arc',          // Circular arc curve
    arcRadius: 600,            // Default arc radius
  },
  blockB: {
    id: 'blockB',
    label: 'Message',
    text: 'You Are The Greatest',
    x: 250,
    y: 1700,
    fontSize: 60,
    fontFamily: 'Arial',
    fill: COLOR_TOKENS.cardTextMessageDefault,
    align: 'center',
    width: 1000,
    curved: true,              // Message follows wavy bezier curve
    curveType: 'wavy-bezier',  // Wavy bezier with multiple direction changes
    arcRadius: 40,             // Wave amplitude
  },
};

function App() {
  const [blocks, setBlocks] = useState<Record<string, TextBlock>>(DEFAULT_BLOCKS);
  const [activeBlock, setActiveBlock] = useState<ActiveBlock>('blockA');
  const [activeElement, setActiveElement] = useState<ActiveElement>('blockA');
  const [showGuides, setShowGuides] = useState(false);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [bgColor, setBgColor] = useState<string>(COLOR_TOKENS.cardBackgroundDefault);
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<CardCanvasHandle>(null);
  // Track object URL for cleanup
  const objectUrlRef = useRef<string | null>(null);

  const updateBlock = useCallback((id: ActiveBlock, updates: Partial<TextBlock>) => {
    const blockLabel = id === 'blockA' ? 'headline' : 'message';
    if ('text' in updates) {
      if (id === 'blockA') trackHeadlineTextEdited();
      else trackMessageTextEdited();
    }
    if ('fontSize' in updates) trackFontSizeChanged(blockLabel);
    if ('fontFamily' in updates) trackFontFamilyChanged(blockLabel, updates.fontFamily!);
    if ('fill' in updates) trackTextColorChanged(blockLabel);
    if ('align' in updates) trackTextAlignmentChanged(blockLabel, updates.align!);

    setBlocks((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, []);

  const moveBlock = useCallback((id: ActiveBlock, x: number, y: number) => {
    trackElementRepositioned(id === 'blockA' ? 'headline' : 'message');
    setBlocks((prev) => ({
      ...prev,
      [id]: { ...prev[id], x, y },
    }));
  }, []);

  const movePhoto = useCallback((x: number, y: number) => {
    trackElementRepositioned('photo');
    setPhoto((prev) => (prev ? { ...prev, x, y } : null));
  }, []);

  const resetPositions = useCallback(() => {
    trackPositionsReset();
    setBlocks((prev) => ({
      ...prev,
      blockA: { ...prev.blockA, x: DEFAULT_BLOCKS.blockA.x, y: DEFAULT_BLOCKS.blockA.y },
      blockB: { ...prev.blockB, x: DEFAULT_BLOCKS.blockB.x, y: DEFAULT_BLOCKS.blockB.y },
    }));
    // Also reset photo to its initial centered position if present
    setPhoto((prev) => {
      if (!prev) return null;
      const s = CARD_WIDTH / prev.naturalWidth;
      return {
        ...prev,
        x: 0,
        y: (CARD_HEIGHT - prev.naturalHeight * s) / 2,
        scaleX: s,
        scaleY: s,
      };
    });
  }, []);

  // Sync activeBlock when activeElement changes to a text block
  const handleSetActiveElement = useCallback((id: ActiveElement) => {
    setActiveElement(id);
    if (id === 'blockA' || id === 'blockB') {
      setActiveBlock(id);
    }
  }, []);

  const handleSetActiveBlock = useCallback((id: ActiveBlock) => {
    trackTextBlockSwitched(id === 'blockA' ? 'headline' : 'message');
    setActiveBlock(id);
    setActiveElement(id);
  }, []);

  // ── Photo handling ──
  const handleAddPhoto = useCallback((file: File) => {
    // Revoke previous URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const s = CARD_WIDTH / naturalW;
      const scaledH = naturalH * s;

      setPhoto({
        src: url,
        naturalWidth: naturalW,
        naturalHeight: naturalH,
        x: 0,
        y: (CARD_HEIGHT - scaledH) / 2,
        scaleX: s,
        scaleY: s,
      });
      setPhotoImage(img);
      setActiveElement('photo');
      trackPhotoAdded();
    };
    img.onerror = () => {
      alert('Could not load this image. Try a JPEG, PNG, or WebP file.');
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
    };
    img.src = url;
  }, []);

  const handleRemovePhoto = useCallback(() => {
    trackPhotoRemoved();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPhoto(null);
    setPhotoImage(null);
    if (activeElement === 'photo') {
      setActiveElement('blockA');
      setActiveBlock('blockA');
    }
  }, [activeElement]);

  const resizePhoto = useCallback((x: number, y: number, scaleX: number, scaleY: number) => {
    trackPhotoResized();
    setPhoto((prev) => (prev ? { ...prev, x, y, scaleX, scaleY } : null));
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleExport = useCallback(() => {
    const dataURL = canvasRef.current?.exportJPEG();
    if (!dataURL) return;

    trackCardExported(blocks.blockA.text, blocks.blockB.text);
    trackCardConversion(blocks.blockA.text, blocks.blockB.text);

    const now = new Date();
    const ts = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '-' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const link = document.createElement('a');
    link.download = `greeting-card-${ts}.jpg`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [blocks]);

  // Keyboard nudge: arrow keys move selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if ((e.key === 'Delete' || e.key === 'Backspace') && activeElement === 'photo') {
        e.preventDefault();
        handleRemovePhoto();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          dy = -step;
          break;
        case 'ArrowDown':
          dy = step;
          break;
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        default:
          return;
      }

      e.preventDefault();

      if (activeElement === 'photo') {
        setPhoto((prev) => {
          if (!prev) return null;
          return { ...prev, x: prev.x + dx, y: prev.y + dy };
        });
      } else {
        setBlocks((prev) => {
          const block = prev[activeElement];
          const estimatedHeight = block.fontSize * 2;
          const newX = Math.max(0, Math.min(block.x + dx, CARD_WIDTH - block.width));
          const newY = Math.max(0, Math.min(block.y + dy, CARD_HEIGHT - estimatedHeight));
          return {
            ...prev,
            [activeElement]: { ...block, x: newX, y: newY },
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElement, handleRemovePhoto]);

  const authUser = useAuthUser();

  return (
    <div className="app-shell">
      <GlobalNav
        apps={authUser.accessibleApps}
        activeAppId="card"
        userEmail={authUser.email}
        onSignOut={authUser.signOut}
        logo={
          <img
            className="h-12 w-auto"
            src="/assets/landing/logo.svg"
            alt="Haderach"
          />
        }
      />
      <div className="app">
      <ControlsPanel
        blocks={blocks}
        activeBlock={activeBlock}
        activeElement={activeElement}
        showGuides={showGuides}
        photo={photo}
        onSetActiveBlock={handleSetActiveBlock}
        onSetActiveElement={handleSetActiveElement}
        onUpdateBlock={updateBlock}
        onResetPositions={resetPositions}
        onToggleGuides={() => {
          setShowGuides((v) => {
            trackSafeMarginsToggled(!v ? 'on' : 'off');
            return !v;
          });
        }}
        onExport={handleExport}
        onAddPhoto={handleAddPhoto}
        bgColor={bgColor}
        onChangeBgColor={(color: string) => {
          trackBgColorChanged(color);
          setBgColor(color);
        }}
      />
      <CardCanvas
        ref={canvasRef}
        blocks={blocks}
        activeElement={activeElement}
        showGuides={showGuides}
        photo={photo}
        photoImage={photoImage}
        onSelectElement={handleSetActiveElement}
        onMoveBlock={moveBlock}
        onMovePhoto={movePhoto}
        onResizePhoto={resizePhoto}
        bgColor={bgColor}
      />
      </div>
    </div>
  );
}

export default App;
