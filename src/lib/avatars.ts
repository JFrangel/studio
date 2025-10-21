/**
 * Sistema de Avatares Animados
 * 
 * Utiliza DiceBear API para generar avatares SVG consistentes y personalizables
 * https://www.dicebear.com/styles/
 */

export type AvatarStyle = 
  | 'adventurer'        // Personajes aventureros (mixto)
  | 'adventurer-neutral' // Personajes neutrales (sin género)
  | 'avataaars'         // Estilo Sketch (mixto)
  | 'avataaars-neutral' // Estilo Sketch neutro
  | 'big-ears'          // Personajes con orejas grandes (mixto)
  | 'big-ears-neutral'  // Orejas grandes neutro
  | 'big-smile'         // Personajes sonrientes (mixto)
  | 'bottts'            // Robots (neutro)
  | 'bottts-neutral'    // Robots neutrales
  | 'croodles'          // Garabatos divertidos (mixto)
  | 'croodles-neutral'  // Garabatos neutros
  | 'fun-emoji'         // Emojis divertidos
  | 'icons'             // Iconos simples
  | 'identicon'         // Patrón geométrico
  | 'initials'          // Iniciales
  | 'lorelei'           // Personajes femeninos
  | 'lorelei-neutral'   // Lorelei neutro
  | 'micah'             // Personajes ilustrados (mixto)
  | 'miniavs'           // Mini avatares (mixto)
  | 'notionists'        // Estilo Notion (mixto)
  | 'notionists-neutral'// Notion neutro
  | 'open-peeps'        // Personajes Open Peeps (mixto)
  | 'personas'          // Personajes diversos (mixto)
  | 'pixel-art'         // Pixel Art (mixto)
  | 'pixel-art-neutral' // Pixel Art neutro
  | 'shapes'            // Formas abstractas
  | 'thumbs';           // Pulgares arriba

// Estilos específicos para avatares de grupo
export type GroupAvatarStyle = AvatarStyle;

export const AVATAR_CATEGORIES = {
  female: {
    label: 'Femenino',
    styles: ['lorelei', 'avataaars', 'adventurer', 'big-smile', 'personas'] as AvatarStyle[],
    icon: '👩'
  },
  male: {
    label: 'Masculino',
    styles: ['micah', 'avataaars', 'adventurer', 'big-ears', 'personas'] as AvatarStyle[],
    icon: '👨'
  },
  neutral: {
    label: 'Neutral',
    styles: ['adventurer-neutral', 'avataaars-neutral', 'big-ears-neutral', 'croodles-neutral', 'notionists-neutral'] as AvatarStyle[],
    icon: '🧑'
  },
  robot: {
    label: 'Robots',
    styles: ['bottts', 'bottts-neutral'] as AvatarStyle[],
    icon: '🤖'
  },
  fun: {
    label: 'Divertidos',
    styles: ['fun-emoji', 'pixel-art', 'croodles', 'big-smile'] as AvatarStyle[],
    icon: '🎉'
  },
  minimal: {
    label: 'Minimalista',
    styles: ['initials', 'icons', 'shapes', 'identicon'] as AvatarStyle[],
    icon: '⚪'
  }
};

// Categorías específicas para avatares de grupos
export const GROUP_AVATAR_CATEGORIES = {
  teams: {
    label: 'Equipos',
    styles: ['personas', 'open-peeps', 'notionists', 'miniavs'] as GroupAvatarStyle[],
    icon: '👥',
    description: 'Para grupos de trabajo y equipos'
  },
  fun: {
    label: 'Divertidos',
    styles: ['fun-emoji', 'croodles', 'big-smile', 'thumbs'] as GroupAvatarStyle[],
    icon: '🎉',
    description: 'Para grupos de amigos y diversión'
  },
  tech: {
    label: 'Tech & Robots',
    styles: ['bottts', 'bottts-neutral', 'pixel-art', 'icons'] as GroupAvatarStyle[],
    icon: '🤖',
    description: 'Para grupos de tecnología'
  },
  abstract: {
    label: 'Abstracto',
    styles: ['shapes', 'identicon', 'pixel-art-neutral'] as GroupAvatarStyle[],
    icon: '🎨',
    description: 'Diseños geométricos y abstractos'
  },
  creative: {
    label: 'Creativos',
    styles: ['croodles', 'adventurer', 'big-ears', 'avataaars'] as GroupAvatarStyle[],
    icon: '✨',
    description: 'Para grupos creativos y artísticos'
  },
  professional: {
    label: 'Profesional',
    styles: ['initials', 'notionists-neutral', 'icons', 'shapes'] as GroupAvatarStyle[],
    icon: '💼',
    description: 'Para entornos profesionales'
  }
};

/**
 * Genera la URL de un avatar usando DiceBear API
 */
export function getAvatarUrl(seed: string, style: AvatarStyle = 'avataaars'): string {
  // DiceBear es gratuito y no requiere API key
  const baseUrl = 'https://api.dicebear.com/7.x';
  
  // Opciones para hacer los avatares más variados
  const options = new URLSearchParams({
    seed: seed,
    size: '200',
    backgroundColor: 'transparent',
  });

  return `${baseUrl}/${style}/svg?${options.toString()}`;
}

/**
 * Genera un seed único para un usuario basado en su ID o email
 */
export function generateAvatarSeed(userId: string): string {
  return userId;
}

/**
 * Obtiene todos los estilos disponibles
 */
export function getAllAvatarStyles(): AvatarStyle[] {
  return Object.values(AVATAR_CATEGORIES).flatMap(category => category.styles);
}

/**
 * Obtiene un estilo aleatorio de una categoría
 */
export function getRandomStyleFromCategory(category: keyof typeof AVATAR_CATEGORIES): AvatarStyle {
  const styles = AVATAR_CATEGORIES[category].styles;
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * Obtiene el estilo por defecto basado en preferencias
 */
export function getDefaultAvatarStyle(): AvatarStyle {
  return 'avataaars'; // Estilo por defecto más popular y neutral
}

/**
 * Obtiene el estilo por defecto para grupos
 */
export function getDefaultGroupAvatarStyle(): GroupAvatarStyle {
  return 'personas'; // Estilo por defecto para grupos
}

/**
 * Genera un seed único para un grupo basado en su nombre o ID
 */
export function generateGroupAvatarSeed(groupId: string): string {
  return `group-${groupId}`;
}

/**
 * Obtiene un estilo aleatorio de una categoría de grupo
 */
export function getRandomGroupStyleFromCategory(category: keyof typeof GROUP_AVATAR_CATEGORIES): GroupAvatarStyle {
  const styles = GROUP_AVATAR_CATEGORIES[category].styles;
  return styles[Math.floor(Math.random() * styles.length)];
}
