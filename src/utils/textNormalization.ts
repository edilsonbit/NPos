export const normalizeText = (value: string | undefined | null) => {
  if (!value) return ''

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export const equalsNormalized = (a: string | undefined | null, b: string | undefined | null) =>
  normalizeText(a) === normalizeText(b)

export const includesNormalized = (source: string | undefined | null, term: string | undefined | null) =>
  normalizeText(source).includes(normalizeText(term))

export const uniqueNormalized = (values: string[]) => {
  const map = new Map<string, string>()

  values.forEach((value) => {
    const key = normalizeText(value)
    if (key && !map.has(key)) {
      map.set(key, value.trim())
    }
  })

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
