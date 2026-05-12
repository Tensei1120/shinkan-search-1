export const CATEGORIES = {
  sports:   'スポーツ系',
  culture:  '文化系',
  academic: '学術系',
  music:    '音楽系',
  outdoor:  'アウトドア',
  food:     '料理・グルメ',
  incircle: 'インカレ',
  other:    'その他',
} as const;

export type Category = keyof typeof CATEGORIES;

export const CATEGORY_COLORS: Record<string, string> = {
  sports:   'bg-blue-100 text-blue-800',
  culture:  'bg-purple-100 text-purple-800',
  academic: 'bg-green-100 text-green-800',
  music:    'bg-amber-100 text-amber-800',
  outdoor:  'bg-teal-100 text-teal-800',
  food:     'bg-rose-100 text-rose-800',
  incircle: 'bg-pink-100 text-pink-800',
  other:    'bg-gray-100 text-gray-700',
};
