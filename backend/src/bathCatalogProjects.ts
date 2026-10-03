export interface BathCatalogProject {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  images: string[];
  area: string;
  floors: string;
  bedrooms: string;
  priceFrom: string;
  constructionType: string;
  category: 'bath';
  badge?: string;
  style?: string;
  isIllustrative: true;
}

const compact = '/api/assets/projects/catalog/bath-compact.webp';
const family = '/api/assets/projects/catalog/bath-family.webp';
const log = '/api/assets/projects/catalog/bath-log.webp';

/** Illustrative starting points for a bespoke estimate, not completed builds or fixed offers. */
export const bathCatalogProjects: BathCatalogProject[] = [
  {
    id: 'bath-compact-12', title: 'Компакт 12',
    shortDescription: 'Небольшая каркасная баня с парной, моечной и предбанником.',
    fullDescription: 'Пример компактной бани для сезонного отдыха или небольшого участка. В схеме 3 × 4 м можно разместить парную, моечную и предбанник; расположение печи, дверей и окон подбирается по требованиям безопасности и пожеланиям владельца. Материал отделки парной, утепление, основание и состав монтажа согласуются отдельно.',
    coverImage: compact, images: [compact], area: '12 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 750 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'Компактный', isIllustrative: true
  },
  {
    id: 'bath-country-16', title: 'Дачная 16',
    shortDescription: 'Каркасный формат 4 × 4 м для регулярных семейных выходных.',
    fullDescription: 'Типовой вариант с парной, душевой и небольшим помещением для переодевания. При необходимости планировку можно изменить: предусмотреть отдельное хранение дров, увеличить моечную или добавить крыльцо. Стоимость дана как рыночный ориентир для простой комплектации; печь, фундамент, подвод коммуникаций и доставка уточняются при расчёте.',
    coverImage: family, images: [family], area: '16 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 790 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'Компактный', isIllustrative: true
  },
  {
    id: 'bath-family-20', title: 'Семейная 20',
    shortDescription: 'Парная, душевая и отдельная комната отдыха в одном объёме.',
    fullDescription: 'Более просторная планировка 4 × 5 м подходит для семьи и приёма гостей. Помимо парной и моечной, можно организовать общую комнату отдыха с местом для стола и хранения вещей. Это концепция для подбора состава помещений, а не готовая рабочая документация; фактические габариты и конструктив проверяются до сметы.',
    coverImage: family, images: [family], area: '20 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 930 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'С комнатой отдыха', isIllustrative: true
  },
  {
    id: 'bath-terrace-24', title: 'С террасой 24',
    shortDescription: 'Баня 4 × 6 м с комнатой отдыха и небольшой открытой террасой.',
    fullDescription: 'Вариант для участка, где хочется объединить банный блок и место отдыха на воздухе. Внутри можно разместить парную, душевую и комнату отдыха, а террасу использовать как летнюю зону. Открытая терраса, печь, дымоход, фундамент и инженерия могут заметно изменить итоговую стоимость и считаются отдельно.',
    coverImage: compact, images: [compact], area: '24 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 1 160 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'С террасой', isIllustrative: true
  },
  {
    id: 'bath-timber-24', title: 'Брусовая 24',
    shortDescription: 'Баня из профилированного бруса с верандой и отдельной зоной отдыха.',
    fullDescription: 'Традиционный внешний вид и понятное зонирование: парная, моечная, помещение отдыха и крыльцо. Порода и сечение бруса, тип межвенцового утепления, защитная обработка и время на усадку влияют на технологию и график. Указанная цена — предварительный ориентир, не публичная оферта.',
    coverImage: family, images: [family], area: '24 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 1 550 000 ₽', constructionType: 'Профилированный брус', category: 'bath', style: 'Деревянная', isIllustrative: true
  },
  {
    id: 'bath-log-36', title: 'Банный дом 36',
    shortDescription: 'Просторный деревянный вариант с большой комнатой отдыха.',
    fullDescription: 'Планировочную идею 6 × 6 м можно адаптировать под семейные встречи: банный блок с парной и душевой дополняется общей комнатой, а перед входом предусматривается небольшое крыльцо. Точный материал стен, конструкция кровли и состав внутренней отделки выбираются при проектировании. Печь и противопожарные узлы подбираются только после согласования планировки.',
    coverImage: log, images: [log], area: '36 м²', floors: '1 этаж', bedrooms: '3 зоны',
    priceFrom: 'от 2 350 000 ₽', constructionType: 'Оцилиндрованное бревно', category: 'bath', style: 'Деревянная', isIllustrative: true
  },
  {
    id: 'bath-guest-48', title: 'Баня-гостевой дом 48',
    shortDescription: 'Увеличенный формат для бани, отдыха и размещения гостей.',
    fullDescription: 'Пример увеличенной планировки с отдельным банным блоком, местом для общего отдыха и дополнительной комнатой. Такой проект особенно зависит от участка и режима использования: необходимо заранее определить отопление, водоснабжение, канализацию, вентиляцию и зимнюю эксплуатацию. Состав проекта и цена — по запросу после обсуждения исходных данных.',
    coverImage: compact, images: [compact], area: '48 м²', floors: '1–2 этажа', bedrooms: '4 зоны',
    priceFrom: 'по запросу', constructionType: 'Деревянная', category: 'bath', style: 'Гостевой формат', isIllustrative: true
  }
];
