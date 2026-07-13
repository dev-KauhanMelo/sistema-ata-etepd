# Ata Digital — ETEPD

Sistema de chamada digital para Representantes de Turma (CRT). Substitui a ata
física de papel: os dois representantes de cada turma marcam presença pelo
celular, com histórico pesquisável e correções auditáveis.

> Especificações completas: [contexto-claude-code (1).md](<contexto-claude-code (1).md>)
> (regras de negócio) e [design-sistema.md](design-sistema.md) (tokens visuais).

## Stack

- **React + Vite + Tailwind CSS** — webapp responsivo, mobile-first
- **Persistência v1: local-first** (localStorage) por trás da camada
  `src/services/` — a troca futura por Supabase/Prisma não afeta as telas
- **`prisma/schema.prisma`** — schema de referência já pronto para a migração
  ao PostgreSQL (Supabase)

## Rodando

```bash
npm install
npm run dev        # acessível pelo celular na mesma rede (host exposto)
```

## Primeiro uso (bootstrap)

1. Acesse **/coordenacao** (senha padrão: `etepd2026`, configurável via
   `VITE_COORD_SENHA` no `.env`).
2. Na aba **Importar**, envie o `.xlsx` da enturmação (uma aba por turma) —
   confira a pré-visualização e confirme. Ou crie turmas/alunos manualmente
   na aba **Turmas**.
3. Na aba **Códigos**, gere **2 códigos de representante por turma** e entregue
   aos representantes.
4. Cada representante cria a conta em **/cadastro** com o código, escolhe a
   turma no dropdown e define a senha. A sessão persiste no dispositivo.

## Regras de negócio centrais

- Presença por **dia** (P / F / FJ), nunca por aula.
- Marcação **incremental**: cada toque salva na hora; queda de conexão ou troca
  de representante retoma exatamente de onde parou (registro de `Chamada` único
  por turma+dia, compartilhado pelos dois representantes).
- Ao finalizar, **20 minutos** de edição livre; depois a sessão trava.
- **Correções pontuais** (chegada tardia / saída antecipada) ficam disponíveis o
  dia inteiro, independentes da trava, sempre com timestamp e autoria.
- Calendário: verde = feita, laranja = parcial, vermelho = dia letivo sem
  chamada. É uma view derivada — **nenhum dado de presença é apagado**.

## Estrutura

```
src/
  components/   # design system (glass, anel de progresso, nav)
  context/      # AuthContext (sessão + RBAC)
  pages/        # Login, Cadastro, Dashboard, Chamada, Correções, Calendário, Coordenação
  routes/       # guards por cargo (aluno/professor) + rota isolada da coordenação
  services/     # "backend" local-first: auth, chamadas, coordenação, import xlsx
  utils/        # datas, hash
prisma/         # schema de referência p/ migração Supabase
```
