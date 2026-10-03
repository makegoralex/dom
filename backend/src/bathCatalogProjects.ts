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

const compact = '/api/assets/projects/catalog/bath-compact-v2.webp';
const country = '/api/assets/projects/catalog/bath-country-v2.webp';
const family = '/api/assets/projects/catalog/bath-family-v2.webp';
const terrace = '/api/assets/projects/catalog/bath-terrace-v2.webp';
const timber = '/api/assets/projects/catalog/bath-timber-v2.webp';
const log = '/api/assets/projects/catalog/bath-log-v2.webp';
const guest = '/api/assets/projects/catalog/bath-guest-v2.webp';

/** Illustrative starting points for a bespoke estimate, not completed builds or fixed offers. */
export const bathCatalogProjects: BathCatalogProject[] = [
  {
    id: 'bath-compact-12', title: 'Компакт 12',
    shortDescription: 'Компактная каркасная баня 3 × 4 м: парная, моечная и предбанник.',
    fullDescription: 'Иллюстративная планировка для небольшого участка и сезонного использования. В базовом варианте — парная, моечная и предбанник; размеры и взаимное расположение помещений можно изменить. Ориентир «от 550 000 ₽» дан для простой комплектации без устройства индивидуального фундамента, печи с дымоходом, подвода коммуникаций и нестандартной доставки. Точную цену фиксируем после выбора утепления, внутренней отделки и состава монтажа.',
    coverImage: compact, images: [compact], area: '12 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · предбанник',
    priceFrom: 'от 550 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'Компактный', isIllustrative: true
  },
  {
    id: 'bath-country-16', title: 'Дачная 16',
    shortDescription: 'Каркасная баня 4 × 4 м с парной, моечной и комнатой отдыха.',
    fullDescription: 'Простой дачный формат с тремя функциональными зонами, который удобно адаптировать под существующий участок. Можно предусмотреть тамбур, отдельное хранение дров или выход на небольшое крыльцо. Рыночный ориентир «от 700 000 ₽» относится к базовой комплектации; печь, дымоход, фундамент, доставка, коммуникации и расширенная отделка считаются отдельно. Состав работ и сроки подтверждаются после осмотра подъезда и обсуждения сезонности использования.',
    coverImage: country, images: [country], area: '16 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · отдых',
    priceFrom: 'от 700 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'Компактный', isIllustrative: true
  },
  {
    id: 'bath-family-20', title: 'Семейная 20',
    shortDescription: 'Планировка 4 × 5 м с парной, моечной и отдельной комнатой отдыха.',
    fullDescription: 'Семейный вариант для регулярного отдыха: помимо парной и моечной, предусмотрена общая комната, где можно поставить стол и оставить место для хранения. Планировку можно скорректировать под количество посетителей и вход с участка. Ориентировочная цена «от 850 000 ₽» — для базового каркасного исполнения; печь, дымоход, фундамент, инженерные сети и чистовая отделка уточняются по комплектации. Это проектная идея, а не рабочий комплект чертежей.',
    coverImage: family, images: [family], area: '20 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · отдых',
    priceFrom: 'от 850 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'С комнатой отдыха', isIllustrative: true
  },
  {
    id: 'bath-terrace-24', title: 'С террасой 24',
    shortDescription: 'Каркасная баня 4 × 6 м с комнатой отдыха и открытой террасой.',
    fullDescription: 'Банный блок с парной и моечной объединён с комнатой отдыха, а терраса добавляет летнее место для отдыха на воздухе. Размер и форма террасы зависят от границ участка; её площадь можно изменить или исключить. Ориентир «от 1 050 000 ₽» не включает автоматически фундамент, печь и дымоход, инженерные подключения, доставку и благоустройство. Финальная смета зависит от выбранной толщины утепления, кровли и внутренней отделки.',
    coverImage: terrace, images: [terrace], area: '24 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · отдых · терраса',
    priceFrom: 'от 1 050 000 ₽', constructionType: 'Каркасные', category: 'bath', style: 'С террасой', isIllustrative: true
  },
  {
    id: 'bath-timber-24', title: 'Брусовая 24',
    shortDescription: 'Баня 4 × 6 м из профилированного бруса с верандой.',
    fullDescription: 'Деревянный вариант с парной, моечной, комнатой отдыха и небольшой верандой. Итоговая стоимость зависит от сечения и влажности бруса, типа соединений, защитной обработки и выбранного межвенцового утеплителя. Ориентировочная цена «от 1 450 000 ₽» — для базового комплекта; печь, фундамент, инженерные работы и чистовая отделка рассчитываются по отдельному заданию. Для брусовой конструкции отдельно согласуем технологический перерыв и дальнейшую отделку.',
    coverImage: timber, images: [timber], area: '24 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · отдых · веранда',
    priceFrom: 'от 1 450 000 ₽', constructionType: 'Профилированный брус', category: 'bath', style: 'Деревянная', isIllustrative: true
  },
  {
    id: 'bath-log-36', title: 'Банный дом 36',
    shortDescription: 'Бревенчатая баня 6 × 6 м с комнатой отдыха и верандой.',
    fullDescription: 'Просторная баня для семейных встреч: парная и душевая отделены от комнаты отдыха, у входа предусмотрена небольшая веранда. Можно выбрать оцилиндрованное бревно или адаптировать идею под другой материал. Предварительная стоимость — «от 1 950 000 ₽»; точный расчёт зависит от диаметра бревна, основания, кровли, печи и дымохода, усадки, внутренней отделки и доставки. Перед строительством проверяем место установки и условия подъезда.',
    coverImage: log, images: [log], area: '36 м²', floors: '1 этаж', bedrooms: 'Парная · моечная · отдых · веранда',
    priceFrom: 'от 1 950 000 ₽', constructionType: 'Оцилиндрованное бревно', category: 'bath', style: 'Деревянная', isIllustrative: true
  },
  {
    id: 'bath-guest-48', title: 'Баня-гостевой дом 48',
    shortDescription: 'Банный дом 6 × 8 м с просторной комнатой отдыха и гостевой зоной.',
    fullDescription: 'Идея совмещает банный блок с отдельным помещением для отдыха и размещения гостей. Планировку важно увязать с режимом эксплуатации: круглогодичное отопление, вентиляция, горячая вода, канализация и противопожарные решения требуют отдельного проектирования. Цена — по запросу после уточнения материала, основания, состава инженерии, отделки и подъезда на участок; типовой ориентир карточки не является сметой или офертой.',
    coverImage: guest, images: [guest], area: '48 м²', floors: '1–2 этажа', bedrooms: 'Банный блок · отдых · гостевая зона',
    priceFrom: 'по запросу', constructionType: 'Деревянная', category: 'bath', style: 'Гостевой формат', isIllustrative: true
  }
];
