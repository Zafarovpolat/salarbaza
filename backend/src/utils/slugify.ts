// backend/src/utils/slugify.ts

/**
 * Генерирует URL-безопасный slug.
 * Никогда не содержит: / \ | пробелы кириллицу
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Кириллица → латиница
    .replace(/а/g, 'a').replace(/б/g, 'b').replace(/в/g, 'v').replace(/г/g, 'g')
    .replace(/д/g, 'd').replace(/е/g, 'e').replace(/ё/g, 'yo').replace(/ж/g, 'zh')
    .replace(/з/g, 'z').replace(/и/g, 'i').replace(/й/g, 'y').replace(/к/g, 'k')
    .replace(/л/g, 'l').replace(/м/g, 'm').replace(/н/g, 'n').replace(/о/g, 'o')
    .replace(/п/g, 'p').replace(/р/g, 'r').replace(/с/g, 's').replace(/т/g, 't')
    .replace(/у/g, 'u').replace(/ф/g, 'f').replace(/х/g, 'kh').replace(/ц/g, 'ts')
    .replace(/ч/g, 'ch').replace(/ш/g, 'sh').replace(/щ/g, 'shch').replace(/ъ/g, '')
    .replace(/ы/g, 'y').replace(/ь/g, '').replace(/э/g, 'e').replace(/ю/g, 'yu')
    .replace(/я/g, 'ya')
    // Узбекские символы
    .replace(/ў/g, 'u').replace(/қ/g, 'q').replace(/ғ/g, 'g').replace(/ҳ/g, 'h')
    .replace(/ʼ/g, '').replace(/'/g, '')
    // ✅ Слеши, пайпы, кавычки → дефис или удаление
    .replace(/[\/\\]/g, '-')
    .replace(/[|«»""''()[\]{}]/g, '')
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Генерирует уникальный slug, проверяя БД
 */
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(text)

  if (!(await checkExists(baseSlug))) {
    return baseSlug
  }

  // Добавляем числовой суффикс
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!(await checkExists(candidate))) {
      return candidate
    }
  }

  // Крайний случай — добавляем timestamp
  return `${baseSlug}-${Date.now()}`
}