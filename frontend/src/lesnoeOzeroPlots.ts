export type LesnoeOzeroPhase = 'lake' | 'forest';
export type LesnoeOzeroPlotStatus = 'available' | 'reserved' | 'sold';

export type LesnoeOzeroPlot = {
  id: string;
  phase: LesnoeOzeroPhase;
  areaSotka: number;
  status: LesnoeOzeroPlotStatus;
  position: { x: number; y: number };
  description: string;
};

export const LESNOE_OZERO_PHASES: Record<LesnoeOzeroPhase, {
  label: string;
  shortLabel: string;
  mapImage: string;
  mapAlt: string;
}> = {
  lake: {
    label: 'Первая очередь · у озера',
    shortLabel: 'У озера',
    mapImage: 'map-lake.jpg',
    mapAlt: 'Схема участков первой очереди ЖК «Лесное озеро»'
  },
  forest: {
    label: 'Вторая очередь · лесной массив',
    shortLabel: 'Лесной массив',
    mapImage: 'map-forest.jpg',
    mapAlt: 'Схема участков второй очереди ЖК «Лесное озеро»'
  }
};

export const LESNOE_OZERO_PLOTS: LesnoeOzeroPlot[] = [
  {
    id: '899', phase: 'lake', areaSotka: 8.6, status: 'available', position: { x: 72, y: 24 },
    description: 'Компактный участок рядом с озером. Подойдёт для постоянного дома или дачи.'
  },
  {
    id: '939', phase: 'lake', areaSotka: 8.9, status: 'available', position: { x: 59, y: 30 },
    description: 'Участок у воды с удобным выходом к внутренней дороге.'
  },
  {
    id: '875', phase: 'lake', areaSotka: 10.1, status: 'available', position: { x: 57, y: 40 },
    description: 'Универсальная площадь и живописное природное окружение.'
  },
  {
    id: '876', phase: 'lake', areaSotka: 10.8, status: 'available', position: { x: 53, y: 49 },
    description: 'Просторный участок с хорошей формой для посадки дома.'
  },
  {
    id: '877', phase: 'lake', areaSotka: 13.3, status: 'available', position: { x: 52, y: 57 },
    description: 'Увеличенная площадь для дома, террасы и дополнительных строений.'
  },
  {
    id: '878', phase: 'lake', areaSotka: 10.1, status: 'available', position: { x: 53, y: 65 },
    description: 'Отдельный участок в центральной части первой очереди.'
  },
  {
    id: '879', phase: 'lake', areaSotka: 10.5, status: 'available', position: { x: 56, y: 73 },
    description: 'Участок рядом с лесным массивом и разворотной площадкой.'
  },
  {
    id: '900', phase: 'lake', areaSotka: 10.2, status: 'available', position: { x: 77, y: 36 },
    description: 'Ровный участок на противоположной стороне основной дороги.'
  },
  {
    id: '902', phase: 'lake', areaSotka: 7.2, status: 'available', position: { x: 82, y: 53 },
    description: 'Компактный вариант для дачного дома или инвестиции.'
  },
  {
    id: '903', phase: 'lake', areaSotka: 7.1, status: 'available', position: { x: 84, y: 63 },
    description: 'Доступный по площади участок у лесной границы.'
  },
  {
    id: '1394', phase: 'forest', areaSotka: 6, status: 'available', position: { x: 68, y: 28 },
    description: 'Компактный лесной участок: под дом, дачу или инвестицию.'
  },
  {
    id: '1388', phase: 'forest', areaSotka: 8.5, status: 'available', position: { x: 69, y: 38 },
    description: 'Участок хорошей формы с удобным расположением у дороги.'
  },
  {
    id: '849', phase: 'forest', areaSotka: 16, status: 'available', position: { x: 58, y: 67 },
    description: 'Редкий крупный участок рядом с водой — под усадьбу или банный комплекс.'
  }
];

export function formatSotka(value: number) {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}
