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
  onUpdateItem: (id: number, updates: Partial<ClothingItem>) => void;
  onAddClick: () => void;
}

type GroupBy = 'season' | 'category';

export default function Wardrobe({ items, categories, onSelectItem, selectedIds, onDeleteItem, onUpdateItem, onAddClick }: WardrobeProps) {
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterSeasons, setFilterSeasons] = useState<Season[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailItem, setDetailItem] = useState<ClothingItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('season');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ClothingItem>>({});

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategories.length === 0 || filterCategories.includes(item.category);
    const matchesSeason = filterSeasons.length === 0 || item.seasons.some(s => filterSeasons.includes(s as Season));
    const matchesSearch = item.location?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSeason && matchesSearch;
  });

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, ClothingItem[]> = {};
    
    if (groupBy === 'season') {
      SEASONS.forEach(season => {
        groups[season] = filteredItems.filter(item => item.seasons.includes(season));
      });
      // Items with no season
      const noSeason = filteredItems.filter(item => item.seasons.length === 0);
      if (noSeason.length > 0) groups['未分类季节'] = noSeason;
    } else {
      categories.forEach(cat => {
        groups[cat.name] = filteredItems.filter(item => item.category === cat.name);
      });
      const other = filteredItems.filter(item => !categories.find(c => c.name === item.category));
      if (other.length > 0) groups['其他'] = other;
    }
    
    return groups;
  }, [filteredItems, groupBy, categories]);

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

  const handleEditSave = () => {
    if (detailItem && editForm) {
      onUpdateItem(detailItem.id, editForm);
      setDetailItem({ ...detailItem, ...editForm } as ClothingItem);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/5 rounded-2xl text-sm outline-none focus:ring-1 ring-black/20"
            />
          </div>
          <button 
            onClick={onAddClick}
            className="px-4 py-3 bg-black text-white rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">添加</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setGroupBy('season')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                groupBy === 'season' ? 'bg-white shadow-sm' : 'opacity-40'
              }`}
            >
              按季节
            </button>
            <button 
              onClick={() => setGroupBy('category')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                groupBy === 'category' ? 'bg-white shadow-sm' : 'opacity-40'
              }`}
            >
              按类别
            </button>
          </div>
          
          <div className="flex gap-2">
            <Filter className="w-4 h-4 opacity-30" />
          </div>
        </div>
      </div>

      {/* Grouped Display */}
      <div className="space-y-12 pb-12">
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          groupItems.length > 0 && (
            <section key={groupName} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-serif italic">{groupName}</h2>
                  <span className="px-2 py-0.5 bg-black/5 rounded-md text-[10px] font-mono opacity-40">{groupItems.length}</span>
                </div>
                <div className="h-px flex-1 bg-black/5 mx-4 hidden md:block" />
              </div>
              
              <div className="relative group/scroll">
                <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-hide snap-x snap-mandatory">
                  <AnimatePresence mode="popLayout">
                    {groupItems.map(item => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={`${groupName}-${item.id}`}
                        className={`relative flex-shrink-0 w-32 md:w-44 lg:w-52 aspect-[3/4] bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer snap-start ${
                          selectedIds.includes(item.id) ? 'border-black ring-1 ring-black shadow-md' : 'border-black/5 hover:border-black/20'
                        }`}
                        onClick={() => onSelectItem(item)}
                      >
                        <img 
                          src={item.image} 
                          alt={item.category} 
                          className="w-full h-full object-contain p-3 md:p-4"
                          referrerPolicy="no-referrer"
                        />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex justify-between items-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailItem(item);
                              setIsEditing(false);
                            }}
                            className="p-1.5 md:p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white"
                          >
                            <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          
                          {deletingId === item.id ? (
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteItem(item.id);
                                  setDeletingId(null);
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded-lg shadow-sm text-[8px] md:text-[10px] font-bold"
                              >
                                确认
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(item.id);
                              }}
                              className="p-1.5 md:p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          )}
                        </div>

                        {selectedIds.includes(item.id) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 pointer-events-none">
                          <span className="text-[8px] font-mono uppercase tracking-tighter bg-white/80 backdrop-blur px-1.5 py-0.5 rounded-md border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.category}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Scroll indicators for iPad/Desktop */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-full bg-gradient-to-r from-[#F5F5F0] to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:block" />
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-full bg-gradient-to-l from-[#F5F5F0] to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:block" />
              </div>
            </section>
          )
        ))}
        
        {filteredItems.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto">
              <Shirt className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm opacity-40">衣柜里空空如也，快去添加吧</p>
            <button 
              onClick={onAddClick}
              className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium"
            >
              添加第一件衣服
            </button>
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="aspect-square bg-black/5 p-8 relative">
              <img src={detailItem.image} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setDetailItem(null)} 
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-2">类别</label>
                    <select 
                      value={editForm.category || detailItem.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full p-3 bg-black/5 rounded-xl text-sm outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-2">季节</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map(season => {
                        const currentSeasons = editForm.seasons || detailItem.seasons;
                        const isSelected = currentSeasons.includes(season);
                        return (
                          <button
                            key={season}
                            onClick={() => {
                              const next = isSelected 
                                ? currentSeasons.filter(s => s !== season)
                                : [...currentSeasons, season];
                              setEditForm({ ...editForm, seasons: next });
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              isSelected ? 'bg-black text-white' : 'bg-black/5'
                            }`}
                          >
                            {season}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-2">存放位置</label>
                    <input 
                      type="text"
                      value={editForm.location ?? detailItem.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="例如：主卧衣柜第三格"
                      className="w-full p-3 bg-black/5 rounded-xl text-sm outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 bg-black/5 rounded-xl text-sm font-medium"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleEditSave}
                      className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium"
                    >
                      保存修改
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif italic">{detailItem.category}</h3>
                      <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">
                        {detailItem.seasons.join(' · ')}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditForm({
                          category: detailItem.category,
                          seasons: detailItem.seasons,
                          location: detailItem.location
                        });
                      }}
                      className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-full text-xs font-medium transition-colors"
                    >
                      编辑信息
                    </button>
                  </div>
                  
                  {detailItem.location && (
                    <div className="p-4 bg-black/5 rounded-2xl">
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">存放位置</span>
                      <p className="text-sm">{detailItem.location}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        onDeleteItem(detailItem.id);
                        setDetailItem(null);
                      }}
                      className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                    <button 
                      onClick={() => setDetailItem(null)}
                      className="flex-[2] py-3 bg-black text-white rounded-xl text-sm font-medium"
                    >
                      关闭
                    </button>
                  </div>
                </>
              )}
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

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}

function Shirt({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z"/></svg>
  );
}
