// src/utils/categoryIcons.tsx
import { Grid2x2, Smartphone, Sofa, Shirt, Sparkles, Dumbbell, Package } from 'lucide-react-native';

export const CATEGORY_ICONS: Record<string, any> = {
  todos:   Grid2x2,
  electro: Smartphone,
  hogar:   Sofa,
  moda:    Shirt,
  belleza: Sparkles,
  deporte: Dumbbell,
  otros:   Package,
};

export function getCategoryIcon(id: string) {
  return CATEGORY_ICONS[id] || Package;
}