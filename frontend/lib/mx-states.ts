// mx-states.ts: the INEGI state catalogue the official directory filters by.
// The codes are INEGI ordering, not ours: renumbering them to look tidy would break the search.
export interface MxState {
  /** INEGI (AGEE) code. The official directory filters by this number, not by name. */
  code: number
  label: string
}

// Chiapas (7) and Chihuahua (8) sit after Colima (6): the catalogue was fixed when
// "Ch" was still a letter of its own.
export const MX_STATES: MxState[] = [
  { code: 1, label: 'Aguascalientes' },
  { code: 2, label: 'Baja California' },
  { code: 3, label: 'Baja California Sur' },
  { code: 4, label: 'Campeche' },
  { code: 5, label: 'Coahuila' },
  { code: 6, label: 'Colima' },
  { code: 7, label: 'Chiapas' },
  { code: 8, label: 'Chihuahua' },
  { code: 9, label: 'Ciudad de México' },
  { code: 10, label: 'Durango' },
  { code: 11, label: 'Guanajuato' },
  { code: 12, label: 'Guerrero' },
  { code: 13, label: 'Hidalgo' },
  { code: 14, label: 'Jalisco' },
  { code: 15, label: 'Estado de México' },
  { code: 16, label: 'Michoacán' },
  { code: 17, label: 'Morelos' },
  { code: 18, label: 'Nayarit' },
  { code: 19, label: 'Nuevo León' },
  { code: 20, label: 'Oaxaca' },
  { code: 21, label: 'Puebla' },
  { code: 22, label: 'Querétaro' },
  { code: 23, label: 'Quintana Roo' },
  { code: 24, label: 'San Luis Potosí' },
  { code: 25, label: 'Sinaloa' },
  { code: 26, label: 'Sonora' },
  { code: 27, label: 'Tabasco' },
  { code: 28, label: 'Tamaulipas' },
  { code: 29, label: 'Tlaxcala' },
  { code: 30, label: 'Veracruz' },
  { code: 31, label: 'Yucatán' },
  { code: 32, label: 'Zacatecas' },
]

export function stateLabel(code: number | null): string | null {
  if (code === null) return null
  return MX_STATES.find(state => state.code === code)?.label ?? null
}
