import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Image as KonvaImage, TextPath, Transformer } from 'react-konva';
import Konva from 'konva';
import type { TextBlock, ActiveBlock, ActiveElement, PhotoState } from './types';
import { CARD_WIDTH, CARD_HEIGHT, SAFE_MARGIN } from './constants';
import { COLOR_TOKENS } from './theme/colors';

/**
 * Generates SVG arc path data for curved text
 * @param x - Starting x position of text block
 * @param y - Starting y position of text block
 * @param width - Width of text block
 * @param arcRadius - Radius of the circular arc (smaller = more curved)
 * @returns SVG path data string
 */
function generateArcPath(x: number, y: number, width: number, arcRadius: number): string {
  // Calculate arc parameters
  // Text will be centered horizontally across the width
  const centerX = x + width / 2;

  // Calculate chord half-length (half of text width)
  const chordHalf = width / 2;

  // Start point (left side of arc)
  const startX = centerX - chordHalf;
  const startY = y;

  // End point (right side of arc)
  const endX = centerX + chordHalf;
  const endY = y;

  // SVG arc command: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  // large-arc-flag = 0 (use smaller arc)
  // sweep-flag = 1 (clockwise direction for upward arc)
  const pathData = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 0 1 ${endX} ${endY}`;

  return pathData;
}

/**
 * Generates SVG wavy bezier path with multiple direction changes
 * Creates a sine-wave-like path using chained cubic bezier segments
 * @param x - Starting x position of text block
 * @param y - Starting y position of text block
 * @param width - Width of text block
 * @param amplitude - Height of each wave peak/trough
 * @returns SVG path data string
 */
function generateWavyBezierPath(x: number, y: number, width: number, amplitude: number): string {
  // 4 segments produce 3 direction changes (up→down→up→down)
  const segments = 4;
  const segWidth = width / segments;

  let path = `M ${x} ${y}`;

  for (let i = 0; i < segments; i++) {
    const segStartX = x + i * segWidth;
    const segEndX = x + (i + 1) * segWidth;
    const direction = i % 2 === 0 ? -1 : 1; // alternate up/down

    const cp1x = segStartX + segWidth / 3;
    const cp1y = y + direction * amplitude;
    const cp2x = segStartX + (2 * segWidth) / 3;
    const cp2y = y + direction * amplitude;

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${segEndX} ${y}`;
  }

  return path;
}

interface CardCanvasProps {
  blocks: Record<string, TextBlock>;
  activeElement: ActiveElement;
  showGuides: boolean;
  photo: PhotoState | null;
  photoImage: HTMLImageElement | null;
  onSelectElement: (id: ActiveElement) => void;
  onMoveBlock: (id: ActiveBlock, x: number, y: number) => void;
  onMovePhoto: (x: number, y: number) => void;
  onResizePhoto: (x: number, y: number, scaleX: number, scaleY: number) => void;
  bgColor: string;
}

export interface CardCanvasHandle {
  exportJPEG: () => string | null;
}

const CardCanvas = forwardRef<CardCanvasHandle, CardCanvasProps>(
  (
    {
      blocks,
      activeElement,
      showGuides,
      photo,
      photoImage,
      onSelectElement,
      onMoveBlock,
      onMovePhoto,
      onResizePhoto,
      bgColor,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const overlayRef = useRef<Konva.Group>(null);
    const [scale, setScale] = useState(1);

    useImperativeHandle(ref, () => ({
      exportJPEG: () => {
        const stage = stageRef.current;
        const overlay = overlayRef.current;
        if (!stage) return null;

        if (overlay) overlay.visible(false);
        stage.batchDraw();

        const ratio = 1 / scale;
        const dataURL = stage.toDataURL({
          mimeType: 'image/jpeg',
          quality: 0.95,
          pixelRatio: ratio,
          x: 0,
          y: 0,
          width: CARD_WIDTH * scale,
          height: CARD_HEIGHT * scale,
        });

        if (overlay) overlay.visible(true);
        stage.batchDraw();

        return dataURL;
      },
    }));

    const updateScale = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const padding = 40;
      const availW = container.clientWidth - padding;
      const availH = container.clientHeight - padding;
      const scaleX = availW / CARD_WIDTH;
      const scaleY = availH / CARD_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1));
    }, []);

    useEffect(() => {
      updateScale();
      const observer = new ResizeObserver(updateScale);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [updateScale]);

    const clampTextPosition = useCallback(
      (node: Konva.Text, block: TextBlock) => {
        const textHeight = node.height();
        let x = node.x();
        let y = node.y();
        x = Math.max(0, Math.min(x, CARD_WIDTH - block.width));
        y = Math.max(0, Math.min(y, CARD_HEIGHT - textHeight));
        return { x, y };
      },
      []
    );

    const handleTextDragEnd = useCallback(
      (id: ActiveBlock, e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target as Konva.Text;
        const block = blocks[id];
        const { x, y } = clampTextPosition(node, block);
        node.position({ x, y });
        onMoveBlock(id, x, y);
      },
      [blocks, clampTextPosition, onMoveBlock]
    );

    const handleTextDragMove = useCallback(
      (id: ActiveBlock, e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target as Konva.Text;
        const block = blocks[id];
        const { x, y } = clampTextPosition(node, block);
        node.position({ x, y });
      },
      [blocks, clampTextPosition]
    );

    // Photo drag — no clamping (photo can be dragged so part is off-card, clipped by Group)
    const handlePhotoDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onMovePhoto(node.x(), node.y());
      },
      [onMovePhoto]
    );

    const textRefA = useRef<Konva.Text | Konva.TextPath>(null);
    const textRefB = useRef<Konva.Text | Konva.TextPath>(null);
    const photoRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    // Attach/detach Transformer to photo node
    useEffect(() => {
      const tr = transformerRef.current;
      if (!tr) return;
      if (activeElement === 'photo' && photoRef.current) {
        tr.nodes([photoRef.current]);
      } else {
        tr.nodes([]);
      }
      tr.getLayer()?.batchDraw();
    }, [activeElement, photo]);

    const handlePhotoTransformEnd = useCallback(() => {
      const node = photoRef.current;
      if (!node) return;
      onResizePhoto(node.x(), node.y(), node.scaleX(), node.scaleY());
    }, [onResizePhoto]);

    const renderSelectionBox = (x: number, y: number, w: number, h: number) => {
      const pad = 8;
      return (
        <Rect
          x={x - pad}
          y={y - pad}
          width={w + pad * 2}
          height={h + pad * 2}
          stroke={COLOR_TOKENS.cardSelectionStroke}
          strokeWidth={3}
          dash={[10, 5]}
          listening={false}
        />
      );
    };

    const activeTextBlock =
      activeElement === 'blockA' || activeElement === 'blockB'
        ? blocks[activeElement]
        : null;
    const activeTextHeight = activeTextBlock
      ? activeTextBlock.curved
        ? activeTextBlock.fontSize * 1.8
        : activeTextBlock.fontSize * 2
      : 0;

    const renderTextBlock = (
      block: TextBlock,
      nodeRef: React.RefObject<Konva.Text | Konva.TextPath | null>
    ) => {
      if (block.curved) {
        // Render curved text using TextPath
        const pathData = block.curveType === 'wavy-bezier'
          ? generateWavyBezierPath(block.x, block.y, block.width, block.arcRadius)
          : generateArcPath(block.x, block.y, block.width, block.arcRadius);

        return (
          <TextPath
            key={block.id}
            ref={nodeRef as React.RefObject<Konva.TextPath>}
            text={block.text || ' '}
            data={pathData}
            fontSize={block.fontSize}
            fontFamily={block.fontFamily}
            fill={block.fill}
            align={block.align}
            draggable
            onClick={() => onSelectElement(block.id)}
            onTap={() => onSelectElement(block.id)}
            onDragStart={() => onSelectElement(block.id)}
            onDragEnd={(e) => handleTextDragEnd(block.id, e)}
            onDragMove={(e) => handleTextDragMove(block.id, e)}
          />
        );
      } else {
        // Render straight text using Text (existing implementation)
        return (
          <Text
            key={block.id}
            ref={nodeRef as React.RefObject<Konva.Text>}
            x={block.x}
            y={block.y}
            text={block.text || ' '}
            fontSize={block.fontSize}
            fontFamily={block.fontFamily}
            fill={block.fill}
            align={block.align}
            width={block.width}
            draggable
            onClick={() => onSelectElement(block.id)}
            onTap={() => onSelectElement(block.id)}
            onDragStart={() => onSelectElement(block.id)}
            onDragEnd={(e) => handleTextDragEnd(block.id, e)}
            onDragMove={(e) => handleTextDragMove(block.id, e)}
            wrap="word"
          />
        );
      }
    };

    const renderPhoto = () => {
      if (!photo || !photoImage) return null;
      return (
        <KonvaImage
          ref={photoRef}
          image={photoImage}
          x={photo.x}
          y={photo.y}
          width={photo.naturalWidth}
          height={photo.naturalHeight}
          scaleX={photo.scaleX}
          scaleY={photo.scaleY}
          draggable
          onClick={() => onSelectElement('photo')}
          onTap={() => onSelectElement('photo')}
          onDragStart={() => onSelectElement('photo')}
          onDragEnd={handlePhotoDragEnd}
          onTransformEnd={handlePhotoTransformEnd}
        />
      );
    };

    const guideLines = [
      [SAFE_MARGIN, SAFE_MARGIN, CARD_WIDTH - SAFE_MARGIN, SAFE_MARGIN],
      [SAFE_MARGIN, CARD_HEIGHT - SAFE_MARGIN, CARD_WIDTH - SAFE_MARGIN, CARD_HEIGHT - SAFE_MARGIN],
      [SAFE_MARGIN, SAFE_MARGIN, SAFE_MARGIN, CARD_HEIGHT - SAFE_MARGIN],
      [CARD_WIDTH - SAFE_MARGIN, SAFE_MARGIN, CARD_WIDTH - SAFE_MARGIN, CARD_HEIGHT - SAFE_MARGIN],
    ];

    const stageWidth = CARD_WIDTH * scale;
    const stageHeight = CARD_HEIGHT * scale;

    const textLayer = (
      <Group key="text">
        {renderTextBlock(blocks.blockA, textRefA)}
        {renderTextBlock(blocks.blockB, textRefB)}
      </Group>
    );

    const photoLayer = <Group key="photo">{renderPhoto()}</Group>;

    return (
      <div className="canvas-container" ref={containerRef}>
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {/* Card background */}
            <Rect
              x={0}
              y={0}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              fill={bgColor}
            />

            {/* Clipped content group — photo behind text, clipped to card bounds */}
            <Group
              clipX={0}
              clipY={0}
              clipWidth={CARD_WIDTH}
              clipHeight={CARD_HEIGHT}
            >
              {photoLayer}
              {textLayer}
            </Group>

            {/* UI overlay group — hidden during export */}
            <Group ref={overlayRef}>
              <Rect
                x={0}
                y={0}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                stroke={COLOR_TOKENS.cardBorderPreview}
                strokeWidth={2 / scale}
                listening={false}
              />

              {showGuides &&
                guideLines.map((pts, i) => (
                  <Line
                    key={i}
                    points={pts}
                    stroke={COLOR_TOKENS.cardGuidesStroke}
                    strokeWidth={2 / scale}
                    dash={[12, 8]}
                    listening={false}
                  />
                ))}

              {activeTextBlock &&
                renderSelectionBox(
                  activeTextBlock.x,
                  activeTextBlock.y,
                  activeTextBlock.width,
                  activeTextHeight
                )}
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                keepRatio={true}
                boundBoxFunc={(_oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) return _oldBox;
                  return newBox;
                }}
              />
            </Group>
          </Layer>
        </Stage>
      </div>
    );
  }
);

CardCanvas.displayName = 'CardCanvas';
export default CardCanvas;
