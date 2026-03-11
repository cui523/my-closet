import { openDB, IDBPDatabase } from 'idb';
import { ClothingItem } from '../types';

const DB_NAME = 'wardrobe_db';
const STORE_ITEMS = 'items';
const STORE_CATEGORIES = 'categories';
const VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
          db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const wardrobeStorage = {
  async getAllClothes(): Promise<ClothingItem[]> {
    const db = await getDB();
    return db.getAll(STORE_ITEMS);
  },

  async saveClothingItem(item: ClothingItem): Promise<void> {
    const db = await getDB();
    await db.put(STORE_ITEMS, item);
  },

  async deleteClothingItem(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_ITEMS, id);
  },

  async getAllCategories(): Promise<any[]> {
    const db = await getDB();
    return db.getAll(STORE_CATEGORIES);
  },

  async saveCategory(category: any): Promise<void> {
    const db = await getDB();
    await db.put(STORE_CATEGORIES, category);
  },

  async saveAllCategories(categories: any[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
    for (const cat of categories) {
      await tx.store.put(cat);
    }
    await tx.done;
  }
};
