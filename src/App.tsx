import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Palette, Shirt } from 'lucide-react';
import AddClothes from './components/AddClothes';
import Wardrobe from './components/Wardrobe';
import Whiteboard from './components/Whiteboard';
import { ClothingItem } from './types';
import { motion, AnimatePresence } from 'motion/react';

type View = 'wardrobe' | 'add' | 'whiteboard';

export default function App() {
  const [view, setView] = useState<View>('wardrobe');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Load clothes from localStorage
      const savedClothes = JSON.parse(localStorage.getItem('wardrobe_items') || '[]');
      setClothes(savedClothes);

      // Load categories from localStorage
      let savedCategories = JSON.parse(localStorage.getItem('wardrobe_categories') || '[]');
      if (savedCategories.length === 0) {
        savedCategories = [
          { id: 1, name: '上装' },
          { id: 2, name: '下装' },
          { id: 3, name: '外套' },
          { id: 4, name: '鞋子' }
        ];
        localStorage.setItem('wardrobe_categories', JSON.stringify(savedCategories));
      }
      setCategories(savedCategories);
    } catch (error) {
      console.error('Failed to load local data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const savedCategories = JSON.parse(localStorage.getItem('wardrobe_categories') || '[]');
      if (savedCategories.find((c: any) => c.name === name)) return;

      const newCategory = { id: Date.now(), name };
      const updated = [...savedCategories, newCategory];
      localStorage.setItem('wardrobe_categories', JSON.stringify(updated));
      setCategories(updated);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const toggleSelectItem = (item: ClothingItem) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id) 
        : [...prev, item]
    );
  };

  const handleDeleteItem = async (id: number) => {
    const savedClothes = JSON.parse(localStorage.getItem('wardrobe_items') || '[]');
    const updated = savedClothes.filter((item: any) => item.id !== id);
    localStorage.setItem('wardrobe_items', JSON.stringify(updated));
    
    setClothes(updated);
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = async (id: number, updates: Partial<ClothingItem>) => {
    const savedClothes = JSON.parse(localStorage.getItem('wardrobe_items') || '[]');
    const updated = savedClothes.map((item: any) => 
      item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem('wardrobe_items', JSON.stringify(updated));
    setClothes(updated);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans pb-24">
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/80 backdrop-blur-md px-6 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic tracking-tight">我的衣柜</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">Personal Wardrobe Curator</p>
        </div>
        
        <div className="flex items-center gap-3">
          {view === 'add' && (
            <button 
              onClick={() => setView('wardrobe')}
              className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-full text-xs font-medium transition-colors"
            >
              返回衣柜
            </button>
          )}
          {selectedItems.length > 0 && view === 'wardrobe' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setView('whiteboard')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">去搭配 ({selectedItems.length})</span>
            </motion.button>
          )}
        </div>
      </header>

      <main className="px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'wardrobe' && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Wardrobe 
                items={clothes} 
                categories={categories}
                onSelectItem={toggleSelectItem}
                selectedIds={selectedItems.map(i => i.id)}
                onDeleteItem={handleDeleteItem}
                onUpdateItem={handleUpdateItem}
                onAddClick={() => setView('add')}
              />
            </motion.div>
          )}

          {view === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AddClothes 
                onSuccess={() => {
                  fetchData();
                  setView('wardrobe');
                }}
                categories={categories}
                onAddCategory={handleAddCategory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {view === 'whiteboard' && (
        <Whiteboard 
          selectedItems={selectedItems} 
          onBack={() => setView('wardrobe')} 
        />
      )}

      {/* Bottom Navigation - Hidden in 'add' view */}
      {view !== 'add' && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-full px-2 py-2 flex items-center gap-1 z-40">
          <button
            onClick={() => setView('wardrobe')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              view === 'wardrobe' ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm font-medium">衣柜</span>
          </button>
          
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 px-6 py-3 rounded-full transition-all hover:bg-black/5"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">添加</span>
          </button>
          
          <div className="w-px h-6 bg-black/10 mx-1" />

          <div className="px-4 flex items-center gap-2 opacity-40">
            <Shirt className="w-4 h-4" />
            <span className="text-xs font-mono">{clothes.length}</span>
          </div>
        </nav>
      )}
    </div>
  );
}
