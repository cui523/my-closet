export interface ClothingItem {
  id: number;
  image: string; // base64 or URL
  originalImage?: string;
  seasons: string[]; // e.g., ["春秋", "夏", "冬"]
  category: string;
  location?: string;
  createdAt: string;
}

export type Season = "春秋" | "夏" | "冬";

export const DEFAULT_CATEGORIES = [
  "卫衣", "裤子", "裙子", "风衣", "短毛衣", "长毛衣", "羽绒服", "T恤", "衬衫"
];

export const SEASONS: Season[] = ["春秋", "夏", "冬"];
