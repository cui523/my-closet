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
      const [clothesRes, categoriesRes] = await Promise.all([
        fetch('/api/clothes'),
        fetch('/api/categories')
      ]);
      const clothesData = await clothesRes.json();
      const categoriesData = await categoriesRes.json();
      setClothes(clothesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  };

  const toggleSelectItem = (item: ClothingItem) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id) 
        : [...prev, item]
    );
  };

  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/clothes/${id}`, { method: 'DELETE' });
    setClothes(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans pb-24">
      <header className="sticky top-0 z-30 bg-[#F5F5F0]/80 backdrop-blur-md px-6 py-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tight">我的衣柜</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 mt-2">Personal Wardrobe Curator</p>
        </div>
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

      {/* Bottom Navigation */}
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
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
            view === 'add' ? 'bg-black text-white' : 'hover:bg-black/5'
          }`}
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
    </div>
  );
}
