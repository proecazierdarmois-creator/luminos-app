// data/creatures.js — Toutes les créatures LUMINOS

export const CREATURES = {

  // ─── LIGNE LUMIKOS ───────────────────────────────────────────
  lumikos: {
    id: 'lumikos', number: '#001', name: 'LUMIKOS', jp: 'ルミコス',
    type: 'Lumière', rarity: 'common', rarityLabel: 'Common', rarityColor: '#00e5ff',
    dropRate: 0.1151,
    description: "Le petit guide des nuits. Sa gemme brille faiblement mais constamment.",
    color: '#a0d8ef', accentColor: '#7ee8fa', bgGradient: ['#0d1a2e', '#0a2040'],
    stats: { hp: 52, maxHp: 52, atk: 38, def: 30, spd: 61 },
    moves: [
      { name: 'Lueur Douce',   power: 15, type: 'light' },
      { name: 'Coup de Queue', power: 10, type: 'normal' },
    ],
  },
  lumivex: {
    id: 'lumivex', number: '#002', name: 'LUMIVEX', jp: 'ルミベクス',
    type: 'Lumière · Vent', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#39ff8f',
    dropRate: 0.092,
    description: "Ses ailes de lumière lui permettent de glisser entre les nuages.",
    color: '#5cdba0', accentColor: '#39ff8f', bgGradient: ['#071a10', '#0a2818'],
    stats: { hp: 78, maxHp: 78, atk: 55, def: 48, spd: 78 },
    moves: [
      { name: 'Rafale Verte', power: 25, type: 'wind' },
      { name: 'Éclat Ailé',   power: 20, type: 'light' },
    ],
  },
  lumirex: {
    id: 'lumirex', number: '#003', name: 'LUMIREX', jp: 'ルミレックス',
    type: 'Lumière · Solaire', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#bf5fff',
    dropRate: 0.024,
    description: "Gardien de l'aurore. Son rugissement fait lever le soleil.",
    color: '#f0b030', accentColor: '#ffd700', bgGradient: ['#1a1000', '#2a1800'],
    stats: { hp: 105, maxHp: 105, atk: 82, def: 70, spd: 88 },
    moves: [
      { name: 'Rugissement Solaire', power: 40, type: 'solar' },
      { name: 'Couronne de Feu',     power: 35, type: 'fire'  },
    ],
  },
  luminos: {
    id: 'luminos', number: '#000', name: 'LUMINOS', jp: 'ルミノス',
    type: 'Cosmique · Légendaire', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#ffa500',
    dropRate: 0.006,
    description: "L'être de lumière primordiale. Son regard contient l'univers entier.",
    color: '#bf5fff', accentColor: '#ffa500', bgGradient: ['#0a0018', '#150030'],
    stats: { hp: 150, maxHp: 150, atk: 120, def: 100, spd: 110 },
    moves: [
      { name: 'Éclipse Totale', power: 65, type: 'cosmic' },
      { name: 'Nova Cosmique',  power: 55, type: 'cosmic' },
    ],
  },

  // ─── CRÉATURES V2 ────────────────────────────────────────────
  pyrox: {
    id: 'pyrox', number: '#004', name: 'PYROX', jp: 'ピロクス',
    type: 'Feu', rarity: 'common', rarityLabel: 'Common', rarityColor: '#ff6b35',
    dropRate: 0.1036,
    description: "Un petit dragon dont les narines crachent des étincelles quand il éternue.",
    color: '#ff6b35', accentColor: '#ffa500', bgGradient: ['#1a0800', '#2a1000'],
    stats: { hp: 58, maxHp: 58, atk: 48, def: 25, spd: 55 },
    moves: [
      { name: 'Souffle Ardent',  power: 20, type: 'fire' },
      { name: 'Griffe Brûlante', power: 15, type: 'fire' },
    ],
  },
  aquila: {
    id: 'aquila', number: '#005', name: 'AQUILA', jp: 'アキラ',
    type: 'Eau', rarity: 'common', rarityLabel: 'Common', rarityColor: '#00aaff',
    dropRate: 0.092,
    description: "Vit dans les sources d'eau pure. Sa queue tourbillonne comme un petit courant.",
    color: '#00aaff', accentColor: '#80d4ff', bgGradient: ['#001a2e', '#002a40'],
    stats: { hp: 60, maxHp: 60, atk: 35, def: 45, spd: 58 },
    moves: [
      { name: "Jet d'Eau",  power: 18, type: 'water' },
      { name: 'Vague Douce', power: 12, type: 'water' },
    ],
  },
  terrak: {
    id: 'terrak', number: '#006', name: 'TERRAK', jp: 'テラク',
    type: 'Terre · Pierre', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#c8a850',
    dropRate: 0.069,
    description: "Son dos est recouvert de cristaux de roche. Dort sous terre pendant des siècles.",
    color: '#c8a850', accentColor: '#e8c870', bgGradient: ['#1a1400', '#2a2000'],
    stats: { hp: 90, maxHp: 90, atk: 60, def: 85, spd: 30 },
    moves: [
      { name: 'Séisme',       power: 35, type: 'earth' },
      { name: 'Bouclier Roc', power: 20, type: 'earth' },
    ],
  },
  ventis: {
    id: 'ventis', number: '#007', name: 'VENTIS', jp: 'ベンティス',
    type: 'Air · Tempête', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#a0c8ff',
    dropRate: 0.018,
    description: "Né d'un cyclone. Ses ailes déchirent le ciel et provoquent des tempêtes locales.",
    color: '#a0c8ff', accentColor: '#e0f0ff', bgGradient: ['#060d1a', '#0a1828'],
    stats: { hp: 88, maxHp: 88, atk: 75, def: 42, spd: 105 },
    moves: [
      { name: 'Cyclone',      power: 45, type: 'wind' },
      { name: 'Lame de Vent', power: 30, type: 'wind' },
    ],
  },
  umbrax: {
    id: 'umbrax', number: '#008', name: 'UMBRAX', jp: 'ウンブラクス',
    type: 'Ombre · Néant', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#8844cc',
    dropRate: 0.006,
    description: "L'anti-lumière. Là où LUMINOS illumine, UMBRAX absorbe.",
    color: '#8844cc', accentColor: '#cc88ff', bgGradient: ['#08000f', '#100018'],
    stats: { hp: 140, maxHp: 140, atk: 130, def: 90, spd: 95 },
    moves: [
      { name: 'Vide Absolu', power: 70, type: 'shadow' },
      { name: 'Néant Total', power: 60, type: 'shadow' },
    ],
  },

  // ─── CRÉATURES V3 ────────────────────────────────────────────
  florix: {
    id: 'florix', number: '#009', name: 'FLORIX', jp: 'フロリクス',
    type: 'Nature', rarity: 'common', rarityLabel: 'Common', rarityColor: '#76c442',
    dropRate: 0.0805,
    description: "Petite créature dont les oreilles sont des feuilles. Adore la pluie.",
    color: '#76c442', accentColor: '#aee060', bgGradient: ['#081408', '#101e08'],
    stats: { hp: 55, maxHp: 55, atk: 35, def: 42, spd: 50 },
    moves: [
      { name: 'Lame Feuille', power: 18, type: 'nature' },
      { name: 'Racines',      power: 12, type: 'nature' },
    ],
  },
  glacix: {
    id: 'glacix', number: '#010', name: 'GLACIX', jp: 'グラシクス',
    type: 'Glace · Cristal', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#80d4ff',
    dropRate: 0.0575,
    description: "Né dans les glaciers éternels. Son souffle congèle instantanément.",
    color: '#80d4ff', accentColor: '#c0eeff', bgGradient: ['#040e18', '#081828'],
    stats: { hp: 72, maxHp: 72, atk: 58, def: 65, spd: 45 },
    moves: [
      { name: 'Blizzard',     power: 28, type: 'ice' },
      { name: 'Éclat Glace',  power: 22, type: 'ice' },
    ],
  },
  voltrax: {
    id: 'voltrax', number: '#011', name: 'VOLTRAX', jp: 'ボルトラクス',
    type: 'Foudre', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#ffe033',
    dropRate: 0.0575,
    description: "Court à la vitesse de l'éclair. Ses pattes génèrent des étincelles à chaque pas.",
    color: '#ffe033', accentColor: '#fff080', bgGradient: ['#181400', '#281e00'],
    stats: { hp: 60, maxHp: 60, atk: 70, def: 30, spd: 110 },
    moves: [
      { name: 'Éclair',   power: 32, type: 'electric' },
      { name: 'Tonnerre', power: 28, type: 'electric' },
    ],
  },
  spectrox: {
    id: 'spectrox', number: '#012', name: 'SPECTROX', jp: 'スペクトロクス',
    type: 'Fantôme · Mystère', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#cc77ff',
    dropRate: 0.018,
    description: "Traverse les murs. Apparaît uniquement quand la lune est pleine.",
    color: '#cc77ff', accentColor: '#e0aaff', bgGradient: ['#100018', '#180028'],
    stats: { hp: 82, maxHp: 82, atk: 88, def: 45, spd: 92 },
    moves: [
      { name: 'Hantise',       power: 40, type: 'ghost' },
      { name: 'Ombre Portée',  power: 32, type: 'ghost' },
    ],
  },
  bouldrak: {
    id: 'bouldrak', number: '#013', name: 'BOULDRAK', jp: 'ボウルドラク',
    type: 'Roche · Acier', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#a08860',
    dropRate: 0.0575,
    description: "Son corps est plus dur que le diamant. Dort pendant des décennies sous les montagnes.",
    color: '#a08860', accentColor: '#c0a880', bgGradient: ['#100c00', '#201800'],
    stats: { hp: 100, maxHp: 100, atk: 65, def: 100, spd: 20 },
    moves: [
      { name: 'Avalanche',      power: 38, type: 'rock' },
      { name: 'Carapace Acier', power: 25, type: 'steel' },
    ],
  },
  pyraflor: {
    id: 'pyraflor', number: '#014', name: 'PYRAFLOR', jp: 'ピラフロール',
    type: 'Feu · Nature', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#ff8c42',
    dropRate: 0.018,
    description: "Fleur de volcan. Ses pétales sont en flammes mais ne brûlent jamais.",
    color: '#ff8c42', accentColor: '#ffb880', bgGradient: ['#180800', '#281000'],
    stats: { hp: 88, maxHp: 88, atk: 78, def: 55, spd: 72 },
    moves: [
      { name: 'Pollen de Feu',  power: 42, type: 'fire' },
      { name: 'Vrille Ardente', power: 35, type: 'fire' },
    ],
  },
  aquafrost: {
    id: 'aquafrost', number: '#015', name: 'AQUAFROST', jp: 'アクアフロスト',
    type: 'Eau · Glace', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#40c8e0',
    dropRate: 0.018,
    description: "Mi-dauphin mi-cristal de glace. Nage dans les eaux arctiques à toute vitesse.",
    color: '#40c8e0', accentColor: '#80e0f0', bgGradient: ['#001820', '#002830'],
    stats: { hp: 95, maxHp: 95, atk: 72, def: 68, spd: 85 },
    moves: [
      { name: 'Vague Gelée', power: 44, type: 'ice' },
      { name: 'Torrent',     power: 36, type: 'water' },
    ],
  },
  thornix: {
    id: 'thornix', number: '#016', name: 'THORNIX', jp: 'ソーニクス',
    type: 'Nature · Poison', rarity: 'common', rarityLabel: 'Common', rarityColor: '#88cc44',
    dropRate: 0.0805,
    description: "Couvert d'épines venimeuses. Malgré son apparence, il est très affectueux avec ses amis.",
    color: '#88cc44', accentColor: '#aaee66', bgGradient: ['#081000', '#102000'],
    stats: { hp: 62, maxHp: 62, atk: 42, def: 48, spd: 58 },
    moves: [
      { name: 'Épines Poison', power: 20, type: 'poison' },
      { name: 'Fouet Liane',   power: 16, type: 'nature' },
    ],
  },
  stormyx: {
    id: 'stormyx', number: '#017', name: 'STORMYX', jp: 'ストームイクス',
    type: 'Foudre · Tempête', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#ffdd00',
    dropRate: 0.006,
    description: "Seigneur des tempêtes. Quand il rugit, les cieux s'ouvrent et la foudre frappe.",
    color: '#ffdd00', accentColor: '#ffee80', bgGradient: ['#100e00', '#201c00'],
    stats: { hp: 145, maxHp: 145, atk: 125, def: 88, spd: 130 },
    moves: [
      { name: 'Tempête Suprême', power: 70, type: 'electric' },
      { name: 'Foudre Divine',   power: 60, type: 'electric' },
    ],
  },
  crystara: {
    id: 'crystara', number: '#018', name: 'CRYSTARA', jp: 'クリスタラ',
    type: 'Cristal · Légendaire', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#aaeeff',
    dropRate: 0.006,
    description: "Forgée dans le cœur d'un glacier éternel. Son corps réfracte la lumière en millions d'éclats.",
    color: '#aaeeff', accentColor: '#ddf8ff', bgGradient: ['#001820', '#002030'],
    stats: { hp: 138, maxHp: 138, atk: 110, def: 120, spd: 95 },
    moves: [
      { name: 'Prisme Glacial',  power: 68, type: 'ice' },
      { name: 'Cristallisation', power: 58, type: 'ice' },
    ],
  },

  // ─── CRÉATURES V4 ────────────────────────────────────────────
  sonarix: {
    id: 'sonarix', number: '#026', name: 'SONARIX', jp: 'ソナリクス',
    type: 'Son · Écho', rarity: 'uncommon', rarityLabel: 'Uncommon', rarityColor: '#dd66ff',
    dropRate: 0.0518,
    description: "Communique par ultrasons. Son cri peut briser le verre à des kilomètres.",
    color: '#dd66ff', accentColor: '#f0aaff', bgGradient: ['#140020', '#1e0030'],
    stats: { hp: 70, maxHp: 70, atk: 65, def: 35, spd: 95 },
    moves: [
      { name: 'Onde de Choc',   power: 30, type: 'sound' },
      { name: 'Cri Strident',   power: 24, type: 'sound' },
    ],
  },
  magnetar: {
    id: 'magnetar', number: '#027', name: 'MAGNETAR', jp: 'マグネター',
    type: 'Métal · Magnétisme', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#7799cc',
    dropRate: 0.0168,
    description: "Son corps attire le métal environnant. Peut dévier les attaques avec des champs magnétiques.",
    color: '#7799cc', accentColor: '#aaccee', bgGradient: ['#0a1018', '#101824'],
    stats: { hp: 92, maxHp: 92, atk: 80, def: 78, spd: 60 },
    moves: [
      { name: 'Pulsion Magnétique', power: 42, type: 'steel' },
      { name: 'Attraction Forcée',  power: 34, type: 'steel' },
    ],
  },
  chronexis: {
    id: 'chronexis', number: '#028', name: 'CHRONEXIS', jp: 'クロネクシス',
    type: 'Temps · Mystère', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#44ddaa',
    dropRate: 0.006,
    description: "Existe simultanément dans le passé, le présent et le futur. Ses engrenages ne s'arrêtent jamais.",
    color: '#44ddaa', accentColor: '#88ffcc', bgGradient: ['#001a14', '#002a20'],
    stats: { hp: 142, maxHp: 142, atk: 115, def: 105, spd: 125 },
    moves: [
      { name: 'Distorsion Temporelle', power: 68, type: 'time' },
      { name: 'Écho du Futur',         power: 58, type: 'time' },
    ],
  },
};

// ─── SHINYS ──────────────────────────────────────────────────────
export const SHINY_CREATURES = {
  lumikos_shiny: {
    id: 'lumikos_shiny', number: '#001✨', name: 'LUMIKOS', jp: 'ルミコス',
    type: 'Lumière', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ff69b4',
    isShiny: true, baseId: 'lumikos',
    description: "Une version rarissime aux reflets roses. Ses yeux brillent d'un rose profond.",
    color: '#ff69b4', accentColor: '#ffb3d9', bgGradient: ['#1a0010', '#2a0020'],
    stats: { hp: 65, maxHp: 65, atk: 48, def: 38, spd: 75 },
    moves: [
      { name: 'Lueur Rose',      power: 20, type: 'light' },
      { name: 'Coup Scintill.',  power: 15, type: 'normal' },
    ],
  },
  lumivex_shiny: {
    id: 'lumivex_shiny', number: '#002✨', name: 'LUMIVEX', jp: 'ルミベクス',
    type: 'Lumière · Vent', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ff6b35',
    isShiny: true, baseId: 'lumivex',
    description: "Ses ailes scintillent d'un orange ardent. Laisse une traîne de braises dans le ciel.",
    color: '#ff6b35', accentColor: '#ffaa80', bgGradient: ['#1a0800', '#2a1000'],
    stats: { hp: 92, maxHp: 92, atk: 68, def: 55, spd: 92 },
    moves: [
      { name: 'Rafale Ardente', power: 32, type: 'fire' },
      { name: 'Éclat Brûlant',  power: 25, type: 'light' },
    ],
  },
  lumirex_shiny: {
    id: 'lumirex_shiny', number: '#003✨', name: 'LUMIREX', jp: 'ルミレックス',
    type: 'Lumière · Solaire', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#00e5ff',
    isShiny: true, baseId: 'lumirex',
    description: "Son pelage azur reflète la lune plutôt que le soleil. Gardien des marées célestes.",
    color: '#00e5ff', accentColor: '#80f0ff', bgGradient: ['#001a2a', '#002a40'],
    stats: { hp: 120, maxHp: 120, atk: 95, def: 82, spd: 100 },
    moves: [
      { name: 'Rugissement Lunaire', power: 48, type: 'water' },
      { name: 'Couronne de Glace',   power: 42, type: 'water' },
    ],
  },
  pyrox_shiny: {
    id: 'pyrox_shiny', number: '#004✨', name: 'PYROX', jp: 'ピロクス',
    type: 'Feu', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#39ff8f',
    isShiny: true, baseId: 'pyrox',
    description: "Un dragon dont les flammes sont vertes — signe d'un pouvoir ancestral rarissime.",
    color: '#39ff8f', accentColor: '#80ffb0', bgGradient: ['#001a08', '#002a10'],
    stats: { hp: 72, maxHp: 72, atk: 62, def: 32, spd: 68 },
    moves: [
      { name: 'Flamme Verte',    power: 28, type: 'fire' },
      { name: 'Griffe Émeraude', power: 20, type: 'normal' },
    ],
  },
  aquila_shiny: {
    id: 'aquila_shiny', number: '#005✨', name: 'AQUILA', jp: 'アキラ',
    type: 'Eau', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ffd700',
    isShiny: true, baseId: 'aquila',
    description: "Nageuse des sources thermales dorées. Sa queue tourbillonne comme de l'or liquide.",
    color: '#ffd700', accentColor: '#ffe880', bgGradient: ['#1a1400', '#2a2000'],
    stats: { hp: 75, maxHp: 75, atk: 45, def: 55, spd: 72 },
    moves: [
      { name: 'Jet Doré',    power: 24, type: 'water' },
      { name: "Vague d'Or",  power: 18, type: 'water' },
    ],
  },
  florix_shiny: {
    id: 'florix_shiny', number: '#009✨', name: 'FLORIX', jp: 'フロリクス',
    type: 'Nature', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ff69b4',
    isShiny: true, baseId: 'florix',
    description: "Version sakura rarissime. Ses feuilles sont des pétales de cerisier rose.",
    color: '#ff69b4', accentColor: '#ffb3d9', bgGradient: ['#1a0010', '#2a0020'],
    stats: { hp: 68, maxHp: 68, atk: 45, def: 52, spd: 64 },
    moves: [
      { name: 'Pétale Rose',     power: 24, type: 'nature' },
      { name: 'Racines Sacrées', power: 18, type: 'nature' },
    ],
  },
  glacix_shiny: {
    id: 'glacix_shiny', number: '#010✨', name: 'GLACIX', jp: 'グラシクス',
    type: 'Glace · Cristal', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ff6b35',
    isShiny: true, baseId: 'glacix',
    description: "Glacix de feu : ses cristaux sont en lave solidifiée, brûlants au toucher.",
    color: '#ff6b35', accentColor: '#ffaa80', bgGradient: ['#1a0800', '#2a1000'],
    stats: { hp: 88, maxHp: 88, atk: 72, def: 78, spd: 58 },
    moves: [
      { name: 'Blizzard Ardent',   power: 36, type: 'fire' },
      { name: 'Éclat Volcanique',  power: 28, type: 'fire' },
    ],
  },
  voltrax_shiny: {
    id: 'voltrax_shiny', number: '#011✨', name: 'VOLTRAX', jp: 'ボルトラクス',
    type: 'Foudre', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#40c8e0',
    isShiny: true, baseId: 'voltrax',
    description: "Voltrax des abysses : sa foudre est bleue, signe d'une puissance extrême.",
    color: '#40c8e0', accentColor: '#80e0f0', bgGradient: ['#001820', '#002830'],
    stats: { hp: 75, maxHp: 75, atk: 88, def: 38, spd: 130 },
    moves: [
      { name: 'Éclair Bleu',       power: 40, type: 'electric' },
      { name: 'Foudre Abyssale',   power: 35, type: 'electric' },
    ],
  },
  spectrox_shiny: {
    id: 'spectrox_shiny', number: '#012✨', name: 'SPECTROX', jp: 'スペクトロクス',
    type: 'Fantôme · Mystère', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ffd700',
    isShiny: true, baseId: 'spectrox',
    description: "Spectrox doré : vu une seule fois par un moine bouddhiste en 1347.",
    color: '#ffd700', accentColor: '#ffe880', bgGradient: ['#1a1400', '#2a2000'],
    stats: { hp: 98, maxHp: 98, atk: 105, def: 55, spd: 110 },
    moves: [
      { name: 'Hantise Dorée', power: 50, type: 'ghost' },
      { name: 'Éclat Sacré',   power: 42, type: 'ghost' },
    ],
  },
  bouldrak_shiny: {
    id: 'bouldrak_shiny', number: '#013✨', name: 'BOULDRAK', jp: 'ボウルドラク',
    type: 'Roche · Acier', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#bf5fff',
    isShiny: true, baseId: 'bouldrak',
    description: "Bouldrak de cristal violet : ses roches sont de l'améthyste pure.",
    color: '#bf5fff', accentColor: '#e0aaff', bgGradient: ['#100018', '#180028'],
    stats: { hp: 120, maxHp: 120, atk: 80, def: 120, spd: 28 },
    moves: [
      { name: 'Avalanche Améthyste', power: 48, type: 'rock' },
      { name: 'Bouclier Cristal',    power: 32, type: 'steel' },
    ],
  },
  pyraflor_shiny: {
    id: 'pyraflor_shiny', number: '#014✨', name: 'PYRAFLOR', jp: 'ピラフロール',
    type: 'Feu · Nature', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#39ff8f',
    isShiny: true, baseId: 'pyraflor',
    description: "Pyraflor des glaces : ses flammes vertes ne brûlent pas mais gèlent.",
    color: '#39ff8f', accentColor: '#80ffb0', bgGradient: ['#001a08', '#002a10'],
    stats: { hp: 105, maxHp: 105, atk: 95, def: 68, spd: 88 },
    moves: [
      { name: 'Pollen Glacial',   power: 52, type: 'ice' },
      { name: 'Vrille Émeraude',  power: 44, type: 'nature' },
    ],
  },
  aquafrost_shiny: {
    id: 'aquafrost_shiny', number: '#015✨', name: 'AQUAFROST', jp: 'アクアフロスト',
    type: 'Eau · Glace', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ff4fa3',
    isShiny: true, baseId: 'aquafrost',
    description: "Aquafrost rose des coraux : nage dans les récifs tropicaux enchantés.",
    color: '#ff4fa3', accentColor: '#ff90c8', bgGradient: ['#180010', '#280018'],
    stats: { hp: 112, maxHp: 112, atk: 88, def: 82, spd: 100 },
    moves: [
      { name: 'Vague Corail',  power: 54, type: 'water' },
      { name: 'Torrent Rose',  power: 46, type: 'water' },
    ],
  },
  thornix_shiny: {
    id: 'thornix_shiny', number: '#016✨', name: 'THORNIX', jp: 'ソーニクス',
    type: 'Nature · Poison', rarity: 'shiny', rarityLabel: '✨ Shiny', rarityColor: '#ffa500',
    isShiny: true, baseId: 'thornix',
    description: "Thornix automnal : ses épines sont orange comme les feuilles d'automne.",
    color: '#ffa500', accentColor: '#ffc860', bgGradient: ['#181000', '#281800'],
    stats: { hp: 78, maxHp: 78, atk: 55, def: 60, spd: 72 },
    moves: [
      { name: 'Épines Automne', power: 28, type: 'poison' },
      { name: 'Fouet Doré',     power: 22, type: 'nature' },
    ],
  },
};


// ─── ÉVOLUTIONS V2 ───────────────────────────────────────────────

// #019 PYRAX — Évolution de Pyrox
export const PYRAX = {
  id: 'pyrax', number: '#019', name: 'PYRAX', jp: 'ピラクス',
  type: 'Feu · Dragon', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#ff4400',
  dropRate: 0,
  description: "L'adolescent dragon de feu. Ses ailes commencent à pousser et ses flammes deviennent bleues.",
  color: '#ff4400', accentColor: '#ff8800', bgGradient: ['#1a0400', '#2a0800'],
  stats: { hp: 85, maxHp: 85, atk: 72, def: 40, spd: 78 },
  moves: [
    { name: 'Flamme Bleue',    power: 45, type: 'fire' },
    { name: 'Griffe Dragon',   power: 38, type: 'fire' },
  ],
  evolvesFrom: 'pyrox',
};

// #020 PYRALORD — Évolution finale de Pyrax
export const PYRALORD = {
  id: 'pyralord', number: '#020', name: 'PYRALORD', jp: 'ピラロード',
  type: 'Feu · Dragon · Légendaire', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#ff2200',
  dropRate: 0,
  description: "Seigneur des flammes primordiales. Son souffle peut fondre n'importe quel métal en quelques secondes.",
  color: '#ff2200', accentColor: '#ffd700', bgGradient: ['#150200', '#250500'],
  stats: { hp: 145, maxHp: 145, atk: 130, def: 75, spd: 95 },
  moves: [
    { name: 'Inferno Royal',   power: 75, type: 'fire' },
    { name: 'Souffle Solaire', power: 65, type: 'solar' },
  ],
  evolvesFrom: 'pyrax',
};

// #021 AQUILON — Évolution d'Aquila
export const AQUILON = {
  id: 'aquilon', number: '#021', name: 'AQUILON', jp: 'アキロン',
  type: 'Eau · Tempête', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#0066ff',
  dropRate: 0,
  description: "Mi-requin mi-tornade aquatique. Crée des typhons en agitant ses nageoires.",
  color: '#0066ff', accentColor: '#00aaff', bgGradient: ['#000a1a', '#001430'],
  stats: { hp: 88, maxHp: 88, atk: 58, def: 68, spd: 82 },
  moves: [
    { name: 'Typhon',          power: 48, type: 'water' },
    { name: 'Torrent Céleste', power: 38, type: 'water' },
  ],
  evolvesFrom: 'aquila',
};

// #022 AQUAREX — Évolution finale d'Aquilon
export const AQUAREX = {
  id: 'aquarex', number: '#022', name: 'AQUAREX', jp: 'アクアレックス',
  type: 'Eau · Abyssal · Légendaire', rarity: 'legendary', rarityLabel: '★ Légendaire', rarityColor: '#0044cc',
  dropRate: 0,
  description: "Roi des océans primoriaux. Son rugissement provoque des tsunamis et fait trembler les continents.",
  color: '#0044cc', accentColor: '#80d4ff', bgGradient: ['#000510', '#000e24'],
  stats: { hp: 150, maxHp: 150, atk: 105, def: 118, spd: 88 },
  moves: [
    { name: 'Maelström',       power: 78, type: 'water' },
    { name: 'Vague Abyssale',  power: 65, type: 'water' },
  ],
  evolvesFrom: 'aquilon',
};

// #023 FLORIVA — Évolution de Florix
export const FLORIVA = {
  id: 'floriva', number: '#023', name: 'FLORIVA', jp: 'フロリバ',
  type: 'Nature · Lumière', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#44bb22',
  dropRate: 0,
  description: "La fleur de lumière. Ses pétales émettent une lumière douce qui guérit les blessures.",
  color: '#44bb22', accentColor: '#88ee44', bgGradient: ['#041004', '#081808'],
  stats: { hp: 82, maxHp: 82, atk: 55, def: 68, spd: 75 },
  moves: [
    { name: 'Pollen Sacré',    power: 42, type: 'nature' },
    { name: 'Lumière Verte',   power: 35, type: 'light' },
  ],
  evolvesFrom: 'florix',
};

// #024 GLACIRATH — Évolution de Glacix
export const GLACIRATH = {
  id: 'glacirath', number: '#024', name: 'GLACIRATH', jp: 'グラシラス',
  type: 'Glace · Roche', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#55bbff',
  dropRate: 0,
  description: "Le colosse de glace. Son armure de cristaux est impénétrable même par les flammes les plus intenses.",
  color: '#55bbff', accentColor: '#aaddff', bgGradient: ['#000810', '#001020'],
  stats: { hp: 108, maxHp: 108, atk: 72, def: 110, spd: 35 },
  moves: [
    { name: 'Avalanche Arctique', power: 52, type: 'ice' },
    { name: 'Forteresse Glace',   power: 42, type: 'ice' },
  ],
  evolvesFrom: 'glacix',
};

// #025 VOLTARIS — Évolution de Voltrax
export const VOLTARIS = {
  id: 'voltaris', number: '#025', name: 'VOLTARIS', jp: 'ボルタリス',
  type: 'Foudre · Cosmique', rarity: 'rare', rarityLabel: 'Rare', rarityColor: '#ffcc00',
  dropRate: 0,
  description: "La tempête incarnée. Voyage à la vitesse de la lumière et peut déclencher des tempêtes solaires.",
  color: '#ffcc00', accentColor: '#ffee88', bgGradient: ['#141000', '#201800'],
  stats: { hp: 78, maxHp: 78, atk: 105, def: 38, spd: 148 },
  moves: [
    { name: 'Éclair Cosmique',  power: 68, type: 'electric' },
    { name: 'Tempête Solaire',  power: 55, type: 'electric' },
  ],
  evolvesFrom: 'voltrax',
};

// ─── CRÉATURES EXCLUSIVES ────────────────────────────────────────
// Uniquement obtenables via codes secrets ou events admin

export const EXCLUSIVE_CREATURES = {

  // 🌌 COSMIQUE
  astralis: {
    id: 'astralis', number: '#EX001', name: 'ASTRALIS', jp: 'アストラリス',
    type: 'Cosmique · Étoile', rarity: 'exclusive', rarityLabel: '★ Exclusif', rarityColor: '#aaeeff',
    isExclusive: true,
    description: "Né au cœur d'une nébuleuse. Son corps est fait de poussière d'étoiles et de lumière primordiale.",
    color: '#aaeeff', accentColor: '#ddf8ff', bgGradient: ['#000820', '#001030'],
    stats: { hp: 160, maxHp: 160, atk: 135, def: 115, spd: 120 },
    moves: [
      { name: 'Supernova',      power: 80, type: 'cosmic' },
      { name: "Pluie d'Étoiles", power: 70, type: 'cosmic' },
    ],
    dropRate: 0,
  },

  // 🎃 HALLOWEEN
  phanteros: {
    id: 'phanteros', number: '#EX002', name: 'PHANTEROS', jp: 'ファントロス',
    type: 'Fantôme · Ténèbres', rarity: 'exclusive', rarityLabel: '🎃 Halloween', rarityColor: '#ff6b00',
    isExclusive: true,
    description: "Apparaît uniquement la nuit d'Halloween. Son rire résonne dans les couloirs vides.",
    color: '#ff6b00', accentColor: '#ffaa44', bgGradient: ['#150800', '#250c00'],
    stats: { hp: 145, maxHp: 145, atk: 140, def: 85, spd: 130 },
    moves: [
      { name: 'Terreur Nocturne', power: 75, type: 'ghost' },
      { name: 'Malédiction',      power: 65, type: 'shadow' },
    ],
    dropRate: 0,
  },

  // 🐉 MYTHOLOGIQUE
  drakovyr: {
    id: 'drakovyr', number: '#EX003', name: 'DRAKOVYR', jp: 'ドラコヴィル',
    type: 'Dragon · Légendaire', rarity: 'exclusive', rarityLabel: '🐉 Mythique', rarityColor: '#cc2200',
    isExclusive: true,
    description: "Le dragon primordial. Existait avant le monde lui-même. Sa chaleur peut fondre les continents.",
    color: '#cc2200', accentColor: '#ff6633', bgGradient: ['#150000', '#250400'],
    stats: { hp: 175, maxHp: 175, atk: 155, def: 110, spd: 105 },
    moves: [
      { name: 'Feu Primordial',   power: 85, type: 'fire' },
      { name: 'Rugissement Myth.', power: 75, type: 'dragon' },
    ],
    dropRate: 0,
  },

  // ❄️ NOËL
  frostael: {
    id: 'frostael', number: '#EX004', name: 'FROSTAEL', jp: 'フロスタエル',
    type: 'Glace · Lumière', rarity: 'exclusive', rarityLabel: '❄️ Noël', rarityColor: '#aaddff',
    isExclusive: true,
    description: "Le gardien de l'hiver éternel. Apporte la neige là où il passe et réchauffe les cœurs.",
    color: '#aaddff', accentColor: '#ffffff', bgGradient: ['#001020', '#002040'],
    stats: { hp: 150, maxHp: 150, atk: 120, def: 130, spd: 110 },
    moves: [
      { name: 'Tempête de Noël',  power: 72, type: 'ice' },
      { name: 'Lumière Hivernale', power: 62, type: 'light' },
    ],
    dropRate: 0,
  },

  // 🌸 ÉTÉ / PHÉNIX
  solaryx: {
    id: 'solaryx', number: '#EX005', name: 'SOLARYX', jp: 'ソラリクス',
    type: 'Feu · Solaire · Mythique', rarity: 'exclusive', rarityLabel: '🔥 Phénix', rarityColor: '#ffaa00',
    isExclusive: true,
    description: "Le phénix solaire. Renaît de ses cendres chaque solstice d'été. Sa chaleur donne la vie.",
    color: '#ffaa00', accentColor: '#ffdd44', bgGradient: ['#200800', '#301200'],
    stats: { hp: 155, maxHp: 155, atk: 145, def: 100, spd: 140 },
    moves: [
      { name: 'Renaissance Solaire', power: 82, type: 'fire' },
      { name: 'Aile de Phénix',      power: 72, type: 'solar' },
    ],
    dropRate: 0,
  },
};

// ─── EXPORTS FINAUX (après toutes les définitions) ────────────────
// Ajoute les évolutions V2 à CREATURES
Object.assign(CREATURES, {
  pyrax: PYRAX, pyralord: PYRALORD,
  aquilon: AQUILON, aquarex: AQUAREX,
  floriva: FLORIVA, glacirath: GLACIRATH, voltaris: VOLTARIS,
});

// Fusionne les exclusives dans CREATURES (visibles partout : collection, invocation exclue via dropRate:0)
Object.assign(CREATURES, EXCLUSIVE_CREATURES);

export const ALL_CREATURES  = { ...CREATURES, ...SHINY_CREATURES };
export const CREATURE_LIST  = Object.values(CREATURES);
export const SHINY_LIST     = Object.values(SHINY_CREATURES);

// ─── Fonction d'invocation ────────────────────────────────────────
export function rollCreature() {
  const rand = Math.random();
  let cumulative = 0;
  for (const creature of CREATURE_LIST) {
    cumulative += creature.dropRate;
    if (rand < cumulative) return { ...creature };
  }
  return { ...CREATURE_LIST[0] };
}

// ─── Types ────────────────────────────────────────────────────────
export const TYPE_EMOJI = {
  'Lumière':            '✦',
  'Lumière · Vent':     '🌿',
  'Lumière · Solaire':  '☀️',
  'Cosmique · Légendaire': '🌌',
  'Feu':                '🔥',
  'Eau':                '💧',
  'Terre · Pierre':     '🪨',
  'Air · Tempête':      '🌪️',
  'Ombre · Néant':      '🌑',
  'Nature':             '🌿',
  'Glace · Cristal':    '❄️',
  'Foudre':             '⚡',
  'Fantôme · Mystère':  '👻',
  'Roche · Acier':      '⛏️',
  'Feu · Nature':       '🌺',
  'Eau · Glace':        '🌊',
  'Nature · Poison':    '☠️',
  'Foudre · Tempête':   '⛈️',
  'Cristal · Légendaire': '💎',
};