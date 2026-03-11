import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, X, Loader2, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { removeBackground } from '../services/gemini';
import { SEASONS, Season } from '../types';
import { resizeImage } from '../utils/image';
import { motion, AnimatePresence } from 'motion/react';
import { wardrobeStorage } from '../services/storage';

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

    try {
      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        image: activeItem.processed,
        originalImage: activeItem.original,
        seasons: activeItem.seasons,
        category: activeItem.category,
        location: activeItem.location,
        createdAt: new Date().toISOString()
      };

      await wardrobeStorage.saveClothingItem(newItem);

      updateActiveItem({ isSaved: true });
      
      // If all saved, trigger success
      const allSaved = items.every((it, idx) => idx === activeIndex ? true : it.isSaved);
      if (allSaved) {
        onSuccess();
        setItems([]);
        setActiveIndex(-1);
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        alert('设备存储空间不足。请清理手机空间后再试。');
      } else {
        alert('保存失败，请检查网络或重试。');
      }
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
    <div className="max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-[2.5rem] shadow-sm border border-black/5">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-serif italic">批量添加衣物</h2>
        {items.length > 0 && (
          <button 
            onClick={() => { setItems([]); setActiveIndex(-1); }}
            className="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            清空列表
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button 
            className="flex flex-col items-center justify-center aspect-video sm:aspect-square border-2 border-dashed border-black/10 rounded-[2rem] hover:bg-black/5 active:scale-95 transition-all group"
            onClick={() => cameraInputRef.current?.click()}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
              <Camera className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-sm md:text-base font-medium">拍照录入</span>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mt-2">Use Camera</p>
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
            className="flex flex-col items-center justify-center aspect-video sm:aspect-square border-2 border-dashed border-black/10 rounded-[2rem] hover:bg-black/5 active:scale-95 transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
              <Upload className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-sm md:text-base font-medium">相册批量选择</span>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mt-2">Upload Photos</p>
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
        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar: Queue */}
          <div className="w-full md:w-32 lg:w-40 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pb-4 md:pb-0 scrollbar-hide">
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-20 md:w-full md:aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                  activeIndex === idx ? 'border-black scale-105 z-10 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
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
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                  className="absolute top-1 left-1 p-1.5 bg-white/90 rounded-full md:opacity-0 group-hover:opacity-100 shadow-sm"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </button>
            ))}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-20 h-20 md:w-full md:aspect-square border-2 border-dashed border-black/10 rounded-2xl flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <Plus className="w-6 h-6 opacity-30" />
            </button>
          </div>

          {/* Main: Editor */}
          <div className="flex-1 space-y-8">
            {activeItem ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative aspect-square bg-black/5 rounded-[2rem] overflow-hidden flex items-center justify-center border border-black/5">
                  {activeItem.isProcessing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 animate-spin mb-3 opacity-20" />
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">正在处理...</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-6 md:p-10">
                      <img 
                        src={activeItem.processed || activeItem.original} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain drop-shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                    <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-mono font-bold border border-black/5 shadow-sm">
                      {activeIndex + 1} / {items.length}
                    </span>
                    {activeItem.isSaved && (
                      <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm">
                        已保存
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center gap-4">
                      <button 
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex(prev => prev - 1)}
                        className="p-3 bg-black/5 rounded-full disabled:opacity-10 hover:bg-black/10 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 space-y-6">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3">季节</label>
                          <div className="flex flex-wrap gap-2">
                            {SEASONS.map(season => (
                              <button
                                key={season}
                                onClick={() => toggleSeason(season)}
                                className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${
                                  activeItem.seasons.includes(season) 
                                    ? 'bg-black text-white shadow-md' 
                                    : 'bg-black/5 hover:bg-black/10'
                                }`}
                              >
                                {season}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3">类别</label>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => updateActiveItem({ category: cat.name })}
                                className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${
                                  activeItem.category === cat.name 
                                    ? 'bg-black text-white shadow-md' 
                                    : 'bg-black/5 hover:bg-black/10'
                                }`}
                              >
                                {cat.name}
                              </button>
                            ))}
                            {showNewCategoryInput ? (
                              <div className="flex gap-2 w-full mt-2">
                                <input
                                  type="text"
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                  placeholder="新类别..."
                                  className="flex-1 px-5 py-2.5 bg-black/5 rounded-full text-xs outline-none focus:ring-1 ring-black/20"
                                  autoFocus
                                />
                                <button onClick={handleAddCategory} className="p-2.5 bg-black text-white rounded-full shadow-sm"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setShowNewCategoryInput(false)} className="p-2.5 bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowNewCategoryInput(true)}
                                className="px-5 py-2.5 rounded-full text-xs bg-black/5 hover:bg-black/10 flex items-center gap-2 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> 新增
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3">位置</label>
                          <input
                            type="text"
                            value={activeItem.location}
                            onChange={(e) => updateActiveItem({ location: e.target.value })}
                            placeholder="存放位置..."
                            className="w-full px-5 py-4 bg-black/5 rounded-2xl text-xs outline-none focus:ring-1 ring-black/20 transition-all"
                          />
                        </div>
                      </div>

                      <button 
                        disabled={activeIndex === items.length - 1}
                        onClick={() => setActiveIndex(prev => prev + 1)}
                        className="p-3 bg-black/5 rounded-full disabled:opacity-10 hover:bg-black/10 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={handleSaveActive}
                      disabled={!activeItem.category || !activeItem.processed || activeItem.isProcessing || activeItem.isSaved}
                      className="w-full py-5 bg-black text-white rounded-2xl font-medium disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      {activeItem.isSaved ? (
                        <><Check className="w-5 h-5" /> 已保存到衣柜</>
                      ) : (
                        '保存这件衣服'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-32">
                <Shirt className="w-20 h-20 mb-6" />
                <p className="text-lg font-serif italic">选择左侧图片开始编辑</p>
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
