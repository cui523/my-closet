import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { ClothingItem } from '../types';
import { ArrowLeft, RotateCcw, Trash2, Download } from 'lucide-react';

interface WhiteboardProps {
  selectedItems: ClothingItem[];
  onBack: () => void;
}

interface CanvasItem {
  id: string;
  itemId: number;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

const URLImage = ({ item, isSelected, onSelect, onChange }: { 
  item: CanvasItem, 
  isSelected: boolean, 
  onSelect: () => void, 
  onChange: (newAttrs: any) => void 
}) => {
  const [img] = useImage(item.image);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (img && (item.width === 0 || item.height === 0)) {
      // Set initial size based on aspect ratio
      const maxWidth = 200;
      const maxHeight = 200;
      let width = img.width;
      let height = img.height;

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const finalWidth = width * ratio;
      const finalHeight = height * ratio;

      onChange({
        ...item,
        width: finalWidth,
        height: finalHeight,
        // Set offset to center for better rotation
        offsetX: finalWidth / 2,
        offsetY: finalHeight / 2,
      });
    }
  }, [img]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      const layer = trRef.current.getLayer();
      if (layer) layer.batchDraw();
    }
  }, [isSelected]);

  if (!img) return null;

  const { image: _, ...restItem } = item;

  return (
    <React.Fragment>
      <KonvaImage
        image={img as any}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...restItem}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...item,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          // Reset scale
          node.scaleX(1);
          node.scaleY(1);
          
          // Calculate new dimensions while strictly maintaining aspect ratio
          const newWidth = Math.max(5, node.width() * scaleX);
          const newHeight = Math.max(5, node.height() * scaleY);
          
          // Use the image's natural aspect ratio to correct any minor drift
          const imageRatio = img.width / img.height;
          let finalWidth = newWidth;
          let finalHeight = newHeight;
          
          if (newWidth / newHeight > imageRatio) {
            finalWidth = newHeight * imageRatio;
          } else {
            finalHeight = newWidth / imageRatio;
          }
          
          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            width: finalWidth,
            height: finalHeight,
            rotation: node.rotation(),
            offsetX: finalWidth / 2,
            offsetY: finalHeight / 2,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio={true}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={10}
          anchorCornerRadius={5}
          anchorStroke="#000"
          anchorFill="#fff"
          borderStroke="#000"
          borderDash={[3, 3]}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function Whiteboard({ selectedItems, onBack }: WhiteboardProps) {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);

    // Initialize canvas items from selected items
    const initialItems = selectedItems.map((item, index) => ({
      id: `canvas-${item.id}-${index}`,
      itemId: item.id,
      image: item.image,
      x: 150 + (index * 40), // Shifted to account for center offset
      y: 150 + (index * 40),
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    }));
    setCanvasItems(initialItems);

    return () => resizeObserver.disconnect();
  }, [selectedItems]);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  const removeItem = () => {
    if (selectedId) {
      setCanvasItems(prev => prev.filter(item => item.id !== selectedId));
      setSelectedId(null);
    }
  };

  const resetCanvas = () => {
    setCanvasItems([]);
    onBack();
  };

  return (
    <div className="fixed inset-0 bg-[#F5F5F0] z-40 flex flex-col">
      <header className="p-4 bg-white border-bottom border-black/5 flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回衣柜</span>
        </button>
        
        <div className="flex gap-2">
          <button 
            onClick={removeItem}
            disabled={!selectedId}
            className="p-2 hover:bg-black/5 rounded-full disabled:opacity-20"
            title="删除选中"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={resetCanvas}
            className="p-2 hover:bg-black/5 rounded-full"
            title="重置"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          ref={stageRef}
        >
          <Layer>
            {canvasItems.map((item, i) => (
              <URLImage
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
                onChange={(newAttrs) => {
                  const items = canvasItems.slice();
                  items[i] = newAttrs;
                  setCanvasItems(items);
                }}
              />
            ))}
          </Layer>
        </Stage>

        {canvasItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <p className="text-2xl font-serif italic">搭配白板</p>
          </div>
        )}
      </div>

      <footer className="p-4 bg-white border-t border-black/5 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">
          自由拖拽、缩放、旋转以搭配你的今日穿搭
        </p>
      </footer>
    </div>
  );
}
