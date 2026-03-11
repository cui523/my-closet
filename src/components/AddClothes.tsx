import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, X, Loader2, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { removeBackground } from '../services/gemini';
import { SEASONS, Season } from '../types';
import { resizeImage } from '../utils/image';
import { motion, AnimatePresence } from 'motion/react';

interface AddClothesProps {
  onSuccess: () => void;
  categories: { id: number; name: string }[];
  onAddCategory: (name: string) => Promise<void>;
}

interface BatchItem {
  id: string;
  original: string;
  processed: string | null;
  isProcessing: boolean;
  error: boolean;
  seasons: Season[];
  category: string;
  location: string;
  isSaved: boolean;
}

export default function AddClothes({ onSuccess, categories, onAddCategory }: AddClothesProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  // Process queue
  useEffect(() => {
    const processNext = async () => {
      const nextIndex = items.findIndex(item => !item.processed && !item.isProcessing && !item.error && !item.isSaved);
      if (nextIndex === -1) return;

      const item = items[nextIndex];
      
      setItems(prev => prev.map((it, idx) => 
        idx === nextIndex ? { ...it, isProcessing: true } : it
      ));

      try {
        // Skip background removal as requested
        setItems(prev => prev.map((it, idx) => 
          idx === nextIndex ? { 
            ...it, 
            processed: item.original, 
            isProcessing: false,
            error: false 
          } : it
        ));
      } catch (error) {
        console.error("Processing failed:", error);
        setItems(prev => prev.map((it, idx) => 
          idx === nextIndex ? { 
            ...it, 
            processed: item.original, 
            isProcessing: false, 
            error: true 
          } : it
        ));
      }
    };

    processNext();
  }, [items]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const newItems: BatchItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
      });
      reader.readAsDataURL(file);
      const base64 = await promise;
      
      // Resize to keep localStorage size manageable
      const { base64: resizedBase64 } = await resizeImage(base64);
      
      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        original: resizedBase64,
        processed: null,
        isProcessing: false,
        error: false,
        seasons: [],
        category: '',
        location: '',
        isSaved: false
      });
    }

    setItems(prev => [...prev, ...newItems]);
    if (activeIndex === -1) setActiveIndex(items.length);
  };

  const updateActiveItem = (updates: Partial<BatchItem>) => {
    if (activeIndex === -1) return;
    setItems(prev => prev.map((it, idx) => 
      idx === activeIndex ? { ...it, ...updates } : it
    ));
  };

  const toggleSeason = (season: Season) => {
    if (!activeItem) return;
    const seasons = activeItem.seasons.includes(season)
      ? activeItem.seasons.filter(s => s !== season)
      : [...activeItem.seasons, season];
    updateActiveItem({ seasons });
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await onAddCategory(name);
      updateActiveItem({ category: name });
      setNewCategory('');
      setShowNewCategoryInput(false);
    } catch (error: any) {
      console.error("Failed to add category:", error);
      alert(`添加类别失败: ${error.message || '未知错误'}`);
    }
  };

  const handleSaveActive = async () => {
    if (!activeItem || !activeItem.processed || !activeItem.category) return;

    const newItem = {
      id: Date.now(),
      image: activeItem.processed,
      originalImage: activeItem.original,
      seasons: activeItem.seasons,
      category: activeItem.category,
      location: activeItem.location,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage via App's onSuccess or direct implementation
    // For simplicity, we'll let App handle the state update
    const savedItems = JSON.parse(localStorage.getItem('wardrobe_items') || '[]');
    localStorage.setItem('wardrobe_items', JSON.stringify([...savedItems, newItem]));

    updateActiveItem({ isSaved: true });
    
    // If all saved, trigger success
    const allSaved = items.every((it, idx) => idx === activeIndex ? true : it.isSaved);
    if (allSaved) {
      onSuccess();
      setItems([]);
      setActiveIndex(-1);
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (activeIndex === index) {
      setActiveIndex(prev => (items.length > 1 ? Math.max(0, index - 1) : -1));
    } else if (activeIndex > index) {
      setActiveIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl shadow-sm border border-black/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif italic">批量添加衣物</h2>
        {items.length > 0 && (
          <button 
            onClick={() => { setItems([]); setActiveIndex(-1); }}
            className="text-xs font-mono uppercase tracking-widest opacity-40 hover:opacity-100"
          >
            清空列表
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button 
            className="flex flex-col items-center justify-center aspect-video sm:aspect-square border-2 border-dashed border-black/10 rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">拍照录入</span>
          </button>
          <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            multiple
            onChange={(e) => handleFiles(e.target.files)} 
          />
          
          <button 
            className="flex flex-col items-center justify-center aspect-video sm:aspect-square border-2 border-dashed border-black/10 rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">相册批量选择</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={(e) => handleFiles(e.target.files)} 
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Queue */}
          <div className="w-full lg:w-48 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 scrollbar-hide">
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-20 lg:w-full lg:aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  activeIndex === idx ? 'border-black scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100'
                } ${item.isSaved ? 'grayscale opacity-30' : ''}`}
              >
                <img src={item.original} className="w-full h-full object-cover" />
                {item.isProcessing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {item.isSaved && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                {item.error && !item.isSaved && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                  className="absolute top-1 left-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 lg:opacity-100"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </button>
            ))}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-20 h-20 lg:w-full lg:aspect-square border-2 border-dashed border-black/10 rounded-xl flex items-center justify-center hover:bg-black/5"
            >
              <Plus className="w-6 h-6 opacity-30" />
            </button>
          </div>

          {/* Main: Editor */}
          <div className="flex-1 space-y-6">
            {activeItem ? (
              <div className="space-y-6">
                <div className="relative aspect-square bg-black/5 rounded-3xl overflow-hidden flex items-center justify-center border border-black/5">
                  {activeItem.isProcessing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-3 opacity-20" />
                      <p className="text-xs font-mono uppercase tracking-widest opacity-40">正在抠图...</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                      <img 
                        src={activeItem.processed || activeItem.original} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain drop-shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                      {activeItem.error && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-[10px] px-4 py-1.5 rounded-full">
                          抠图失败，已使用原图
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                    <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-mono font-bold border border-black/5">
                      {activeIndex + 1} / {items.length}
                    </span>
                    {activeItem.isSaved && (
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                        已保存
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center gap-4">
                    <button 
                      disabled={activeIndex === 0}
                      onClick={() => setActiveIndex(prev => prev - 1)}
                      className="p-3 bg-black/5 rounded-full disabled:opacity-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">季节</label>
                        <div className="flex flex-wrap gap-2">
                          {SEASONS.map(season => (
                            <button
                              key={season}
                              onClick={() => toggleSeason(season)}
                              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                                activeItem.seasons.includes(season) 
                                  ? 'bg-black text-white' 
                                  : 'bg-black/5 hover:bg-black/10'
                              }`}
                            >
                              {season}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">类别</label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => updateActiveItem({ category: cat.name })}
                              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                                activeItem.category === cat.name 
                                  ? 'bg-black text-white' 
                                  : 'bg-black/5 hover:bg-black/10'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                          {showNewCategoryInput ? (
                            <div className="flex gap-2 w-full mt-1">
                              <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                placeholder="新类别..."
                                className="flex-1 px-4 py-2 bg-black/5 rounded-full text-xs outline-none focus:ring-1 ring-black/20"
                                autoFocus
                              />
                              <button onClick={handleAddCategory} className="p-2 bg-black text-white rounded-full"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setShowNewCategoryInput(false)} className="p-2 bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowNewCategoryInput(true)}
                              className="px-4 py-2 rounded-full text-xs bg-black/5 hover:bg-black/10 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> 新增
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">位置</label>
                        <input
                          type="text"
                          value={activeItem.location}
                          onChange={(e) => updateActiveItem({ location: e.target.value })}
                          placeholder="存放位置..."
                          className="w-full px-4 py-3 bg-black/5 rounded-2xl text-xs outline-none focus:ring-1 ring-black/20"
                        />
                      </div>
                    </div>

                    <button 
                      disabled={activeIndex === items.length - 1}
                      onClick={() => setActiveIndex(prev => prev + 1)}
                      className="p-3 bg-black/5 rounded-full disabled:opacity-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleSaveActive}
                    disabled={!activeItem.category || !activeItem.processed || activeItem.isProcessing || activeItem.isSaved}
                    className="w-full py-4 bg-black text-white rounded-2xl font-medium disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {activeItem.isSaved ? (
                      <><Check className="w-5 h-5" /> 已保存到衣柜</>
                    ) : activeItem.isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> 正在抠图...</>
                    ) : (
                      '保存这件衣服'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <Shirt className="w-16 h-16 mb-4" />
                <p className="font-serif italic">选择左侧图片开始编辑</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Shirt({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
  );
}
