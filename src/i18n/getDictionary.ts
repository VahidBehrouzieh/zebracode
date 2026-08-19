import 'server-only';

const dictionaries = {
  fa: async () => ({
    // layout: (await import('@/dictionaries/fa/layout.json')).default,
    home: (await import('@/dictionaries/fa/home.json')).default,
    tools: (await import('@/dictionaries/fa/tools.json')).default,
  }),
  en: async () => ({
    // layout: (await import('@/dictionaries/en/layout.json')).default,
    home: (await import('@/dictionaries/en/home.json')).default,
    tools: (await import('@/dictionaries/en/tools.json')).default,
  }),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
    return dictionaries[locale]();
};