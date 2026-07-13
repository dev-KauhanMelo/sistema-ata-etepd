// Datas de chamada são sempre strings 'YYYY-MM-DD' no fuso local —
// granularidade por dia é decisão definitiva do projeto (contexto §3.3).

export function hojeISO() {
  return dataISO(new Date())
}

export function dataISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatarDataCurta(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatarHora(isoDateTime) {
  return new Date(isoDateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ehFimDeSemana(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return dow === 0 || dow === 6
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const DIAS_SEMANA_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
