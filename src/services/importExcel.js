import { mutate, uid, agora } from './storage.js'

// Fast-inject-file: import de .xlsx com uma aba por turma (contexto §4.6).
// Roda UMA única vez (carga inicial) — não existe lógica de reimport/diff;
// manutenção contínua é sempre pelo CRUD manual da coordenação.

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
}

// "1A" -> "1º Ano A", "2B" -> "2º Ano B"; nomes fora do padrão ficam como estão
// (a coordenação confirma/edita na pré-visualização).
export function sugerirNomeTurma(nomeAba) {
  const m = normalizar(nomeAba).match(/^(\d)\s*([A-Z])$/)
  if (m) return `${m[1]}º Ano ${m[2]}`
  return nomeAba.trim()
}

// Lê o arquivo e devolve APENAS a pré-visualização — nada é gravado aqui.
// A gravação exige confirmação explícita da coordenação (confirmarImport).
export async function lerArquivoParaPreview(file) {
  // import dinâmico: a lib xlsx (~500kB) só é baixada quando a coordenação
  // realmente usa o import — nunca no caminho do representante
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const preview = []

  for (const nomeAba of wb.SheetNames) {
    const sheet = wb.Sheets[nomeAba]
    // matriz de linhas; células mescladas (B:D) têm o valor na primeira célula
    const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

    // Localiza dinamicamente a linha de cabeçalho (MATRICULA + NOME) —
    // nunca assumir posição fixa (contexto §4.6).
    const idxCabecalho = linhas.findIndex((linha) => {
      const celulas = (linha || []).map(normalizar)
      return celulas.some((c) => c.includes('MATRICULA')) && celulas.some((c) => c === 'NOME' || c.includes('NOME'))
    })

    const alunos = []
    const avisos = []
    if (idxCabecalho === -1) {
      avisos.push('Cabeçalho MATRICULA/NOME não encontrado — aba ignorada.')
    } else {
      // Lê da linha seguinte ao cabeçalho até a primeira linha vazia APÓS o
      // início dos dados — no formato real há uma linha em branco entre o
      // cabeçalho (linha 4) e o primeiro aluno (linha 6), que deve ser pulada.
      // A quantidade de alunos varia por turma, nunca é fixa (§3.8).
      let dadosIniciados = false
      for (let i = idxCabecalho + 1; i < linhas.length; i++) {
        const linha = linhas[i] || []
        const vazia = linha.every((c) => c === null || String(c).trim() === '')
        if (vazia) {
          if (dadosIniciados) break
          continue
        }
        dadosIniciados = true
        const matricula = linha[0]
        const nome = linha[1]
        if (matricula === null || !nome) {
          avisos.push(`Linha ${i + 1} incompleta (matrícula ou nome ausente) — pulada.`)
          continue
        }
        alunos.push({ matricula: String(matricula).trim(), nome: String(nome).trim() })
      }
    }

    preview.push({
      aba: nomeAba,
      nomeTurma: sugerirNomeTurma(nomeAba),
      alunos,
      avisos,
      incluir: alunos.length > 0,
    })
  }

  return preview
}

// Grava turmas + alunos após confirmação explícita da coordenação.
export function confirmarImport(preview) {
  return mutate((db) => {
    const criadas = []
    for (const item of preview) {
      if (!item.incluir || item.alunos.length === 0) continue
      if (db.turmas.some((t) => t.nome.toLowerCase() === item.nomeTurma.toLowerCase()))
        throw new Error(`A turma "${item.nomeTurma}" já existe — o import é apenas para carga inicial.`)
      const turma = {
        id: uid(),
        nome: item.nomeTurma,
        codigoPlanilha: item.aba,
        criadoEm: agora(),
      }
      db.turmas.push(turma)
      for (const a of item.alunos) {
        db.alunos.push({
          id: uid(),
          matricula: a.matricula,
          nome: a.nome,
          turmaId: turma.id,
          ativo: true,
          criadoEm: agora(),
        })
      }
      criadas.push({ turma: turma.nome, alunos: item.alunos.length })
    }
    return criadas
  })
}
