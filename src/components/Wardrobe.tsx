import React, { useState } from 'react';
import { Search, Filter, Info, Trash2 } from 'lucide-react';
import { ClothingItem, Season, SEASONS } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WardrobeProps {
  items: ClothingItem[];
  categories: { id: number; name: string }[];
  onSelectItem: (item: ClothingItem) => void;
  selectedIds: number[];
  onDeleteItem: (id: number) => void;
}

export default function Wardrobe({ items, categories, onSelectItem, selectedIds, onDeleteItem }: WardrobeProps) {
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterSeasons, setFilterSeasons] = useState<Season[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailItem, setDetailItem] = useState<ClothingItem | null>(null);

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategories.length === 0 || filterCategories.includes(item.category);
    const matchesSeason = filterSeasons.length === 0 || item.seasons.some(s => filterSeasons.includes(s as Season));
    const matchesSearch = item.location?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSeason && matchesSearch;
  });

  const toggleCategory = (cat: string) => {
    setFilterCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSeason = (season: Season) => {
    setFilterSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input
            type="text"
            placeholder="搜索类别或位置..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/5 rounded-2xl text-sm outline-none focus:ring-1 ring-black/20"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 w-full mb-1">季节筛选</span>
            {SEASONS.map(season => (
              <button
                key={season}
                onClick={() => toggleSeason(season)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  filterSeasons.includes(season) ? 'bg-black text-white' : 'bg-black/5'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 w-full mb-1">类别筛选</span>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  filterCategories.includes(cat.name) ? 'bg-black text-white' : 'bg-black/5'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id}
              className={`relative group aspect-[3/4] bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                selectedIds.includes(item.id) ? 'border-black ring-1 ring-black' : 'border-black/5'
              }`}
              onClick={() => onSelectItem(item)}
            >
              <img 
                src={item.image} 
                alt={item.category} 
                className="w-full h-full object-contain p-4"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailItem(item);
                  }}
                  className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white"
                >
                  <Info className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('确定要删除这件衣服吗？')) onDeleteItem(item.id);
                  }}
                  className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {selectedIds.includes(item.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="aspect-square bg-black/5 p-8">
              <img src={detailItem.image} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-serif italic">{detailItem.category}</h3>
                  <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">
                    {detailItem.seasons.join(' · ')}
                  </p>
                </div>
                <button onClick={() => setDetailItem(null)} className="p-2 hover:bg-black/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {detailItem.location && (
                <div className="p-4 bg-black/5 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">存放位置</span>
                  <p className="text-sm">{detailItem.location}</p>
                </div>
              )}

              <button 
                onClick={() => setDetailItem(null)}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
