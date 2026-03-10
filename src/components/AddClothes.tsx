import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, X, Loader2, Plus } from 'lucide-react';
import { removeBackground } from '../services/gemini';
import { SEASONS, Season } from '../types';

interface AddClothesProps {
  onSuccess: () => void;
  categories: { id: number; name: string }[];
  onAddCategory: (name: string) => Promise<void>;
}

export default function AddClothes({ onSuccess, categories, onAddCategory }: AddClothesProps) {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const processImage = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setProcessError(false);
    try {
      const result = await removeBackground(base64, mimeType);
      setProcessedImage(result);
      if (result === base64) setProcessError(true);
    } catch (error) {
      console.error(error);
      setProcessedImage(base64);
      setProcessError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSeason = (season: Season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const handleSubmit = async () => {
    if (!processedImage || !selectedCategory) return;

    const response = await fetch('/api/clothes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: processedImage,
        originalImage: image,
        seasons: selectedSeasons,
        category: selectedCategory,
        location: location
      })
    });

    if (response.ok) {
      onSuccess();
      reset();
    }
  };

  const reset = () => {
    setImage(null);
    setProcessedImage(null);
    setSelectedSeasons([]);
    setSelectedCategory('');
    setLocation('');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await onAddCategory(newCategory.trim());
    setSelectedCategory(newCategory.trim());
    setNewCategory('');
    setShowNewCategoryInput(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-black/5">
      <h2 className="text-2xl font-serif italic mb-6">添加新衣物</h2>
      
      {!image ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-black/10 rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
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
            onChange={handleFileChange} 
          />
          
          <button 
            className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-black/10 rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">相册选择</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-square bg-black/5 rounded-2xl overflow-hidden flex items-center justify-center">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-mono uppercase tracking-widest opacity-50">正在自动抠图...</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={processedImage || image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                {processError && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full">
                    抠图失败，已使用原图
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={reset}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-2">季节 (多选)</label>
              <div className="flex gap-2">
                {SEASONS.map(season => (
                  <button
                    key={season}
                    onClick={() => toggleSeason(season)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedSeasons.includes(season) 
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
              <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-2">类别</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategory === cat.name 
                        ? 'bg-black text-white' 
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="输入新类别"
                      className="flex-1 px-4 py-3 bg-black/5 rounded-full text-sm outline-none focus:ring-2 ring-black/20"
                      autoFocus
                    />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddCategory();
                      }} 
                      className="px-4 bg-black text-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowNewCategoryInput(false)} 
                      className="p-3 bg-black/5 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCategoryInput(true)}
                    className="px-4 py-2 rounded-full text-sm bg-black/5 hover:bg-black/10 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 新增
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-50 mb-2">存放位置 (可选)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：主卧大柜子第三层"
                className="w-full px-4 py-3 bg-black/5 rounded-2xl text-sm outline-none focus:ring-1 ring-black/20"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory || isProcessing}
                className="w-full py-4 bg-black text-white rounded-2xl font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/90 active:scale-[0.98] transition-all"
              >
                {isProcessing ? '正在处理图片...' : '保存到衣柜'}
              </button>
              {!selectedCategory && !isProcessing && image && (
                <p className="text-[10px] text-center text-red-500 font-medium">请先选择或新增一个类别</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
