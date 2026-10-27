import type {
  Case,
  CaseListQuery,
  CaseListResponse,
  CasePriority,
  CaseStatus,
  CaseSummary,
  MasterData,
  CreateReplyRequest,
  CustomerListQuery,
  CustomerListResponse,
  CustomerProfile,
  CustomerSegment,
  Queue,
  Role,
  Session,
  TimelineEntry,
  UpdateCaseRequest,
  User,
} from '@crm/api-client'

const DAY_MS = 86_400_000
const TOTAL_CASES = 10_000

const USERS: Record<Role, User> = {
  l1: { id: 'user-l1', name: 'Rani Lestari', email: 'rani.lestari@example.com', role: 'l1' },
  l2: { id: 'user-l2', name: 'Budi Santoso', email: 'budi.santoso@example.com', role: 'l2' },
  supervisor: {
    id: 'user-supervisor',
    name: 'Sari Wulandari',
    email: 'sari.wulandari@example.com',
    role: 'supervisor',
  },
  admin: {
    id: 'user-admin',
    name: 'Dewi Anggraini',
    email: 'dewi@example.com',
    role: 'admin',
  },
}

/** PRNG deterministik supaya data dev/e2e stabil antar reload. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

const random = createRandom(20261022)

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] ?? items[0]!
}

const FIRST_NAMES = [
  'Fadlan',
  'Rani',
  'Budi',
  'Siti',
  'Agus',
  'Dewi',
  'Rizky',
  'Putri',
  'Hendra',
  'Maya',
]
const LAST_NAMES = [
  'Pratama',
  'Lestari',
  'Santoso',
  'Nurhaliza',
  'Wijaya',
  'Saputra',
  'Anggraini',
  'Hidayat',
]
const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Makassar', 'Denpasar']
const SUBJECTS = [
  'Paket belum diterima',
  'Resi tidak update',
  'Alamat pengiriman salah',
  'Barang rusak saat diterima',
  'Permintaan pickup ulang',
  'Klaim asuransi pengiriman',
  'Perubahan alamat tujuan',
  'Status pengiriman tidak berubah',
]

export const MASTER_DATA: MasterData = {
  statuses: [
    { code: 'open', label: 'Baru', tone: 'info' },
    { code: 'pending', label: 'Menunggu', tone: 'warning' },
    { code: 'resolved', label: 'Selesai', tone: 'success' },
    { code: 'closed', label: 'Ditutup', tone: 'muted' },
  ],
  queues: [
    { code: 'l1', label: 'Antrean L1', tone: 'neutral' },
    { code: 'l2', label: 'Antrean L2', tone: 'neutral' },
    { code: 'escalated', label: 'Eskalasi', tone: 'danger' },
  ],
  priorities: [
    { code: 'low', label: 'Rendah', tone: 'muted' },
    { code: 'normal', label: 'Normal', tone: 'neutral' },
    { code: 'high', label: 'Tinggi', tone: 'warning' },
    { code: 'urgent', label: 'Urgent', tone: 'danger' },
  ],
}

function weightedStatus(): CaseStatus {
  const roll = random()
  if (roll < 0.55) return 'open'
  if (roll < 0.8) return 'pending'
  if (roll < 0.95) return 'resolved'
  return 'closed'
}

function weightedPriority(): CasePriority {
  const roll = random()
  if (roll < 0.15) return 'low'
  if (roll < 0.65) return 'normal'
  if (roll < 0.9) return 'high'
  return 'urgent'
}

function weightedQueue(): Queue {
  const roll = random()
  if (roll < 0.45) return 'l1'
  if (roll < 0.8) return 'l2'
  return 'escalated'
}

const ASSIGNEES: User[] = [USERS.l1, USERS.l2, USERS.supervisor]

function createTimeline(index: number, createdAt: string, assignee: User | null): TimelineEntry[] {
  if (index % 3 !== 0) return []

  const entries: TimelineEntry[] = [
    {
      id: `entry-${index}-0`,
      type: 'note',
      author: USERS.l1,
      body: 'Customer menghubungi lewat chat dan meminta update pengiriman.',
      visibility: 'internal',
      createdAt,
    },
  ]

  if (assignee) {
    entries.push({
      id: `entry-${index}-1`,
      type: 'assignment',
      author: USERS.supervisor,
      body: `Case di-assign ke ${assignee.name}.`,
      visibility: 'internal',
      createdAt: new Date(new Date(createdAt).getTime() + 3_600_000).toISOString(),
    })
  }

  return entries
}

function createCase(index: number): Case {
  // Rentang 2–30 hari lalu, dan update maksimal 2 hari setelah dibuat, supaya
  // updatedAt tidak pernah di masa depan (relative time tetap masuk akal).
  const createdAt = new Date(Date.now() - (2 + Math.floor(random() * 28)) * DAY_MS)
  const updatedAt = new Date(createdAt.getTime() + Math.floor(random() * 2 * DAY_MS))
  const status = weightedStatus()
  const assignee = random() < 0.65 ? pick(ASSIGNEES) : null
  const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  const city = pick(CITIES)
  const createdAtIso = createdAt.toISOString()

  return {
    id: `case-${String(index).padStart(5, '0')}`,
    code: `CASE-2026-${String(100_000 + index)}`,
    subject: pick(SUBJECTS),
    description: `Customer melaporkan kendala pengiriman ke ${city}. Mohon dicek riwayat perjalanan paket.`,
    status,
    queue: weightedQueue(),
    priority: weightedPriority(),
    assignee,
    customer: {
      id: `cust-${index}`,
      name: customerName,
      phone: `0812${String(30_000_000 + index * 7).slice(0, 8)}`,
      email: `${customerName.split(' ')[0]?.toLowerCase() ?? 'customer'}${index}@example.com`,
      address: `Jl. ${pick(LAST_NAMES)} No. ${1 + (index % 120)}, ${city}`,
    },
    shipmentId: index % 4 === 0 ? null : `SHP-${String(500_000 + index)}`,
    sttNumber: index % 3 === 0 ? null : `STT${String(900_000_000 + index)}`,
    tags: index % 5 === 0 ? ['prioritas', 'retur'] : [],
    slaDueAt:
      status === 'open' || status === 'pending'
        ? new Date(updatedAt.getTime() + (4 + (index % 44)) * 3_600_000).toISOString()
        : null,
    createdAt: createdAtIso,
    updatedAt: updatedAt.toISOString(),
    timeline: createTimeline(index, createdAtIso, assignee),
  }
}

const cases: Case[] = Array.from({ length: TOTAL_CASES }, (_, index) => createCase(index + 1))
const casesById = new Map(cases.map((item) => [item.id, item]))

const SEGMENTS: CustomerSegment[] = ['regular', 'business', 'priority']

/** Customer diturunkan dari data case supaya kedua modul konsisten (id sama). */
const customers: CustomerProfile[] = cases.map((item, index) => {
  const city = item.customer.address?.split(', ').at(-1) ?? 'Jakarta'
  return {
    ...item.customer,
    segment: SEGMENTS[index % SEGMENTS.length] ?? 'regular',
    city,
    createdAt: item.createdAt,
  }
})
const customersById = new Map(customers.map((item) => [item.id, item]))
const usersById = new Map(Object.values(USERS).map((user) => [user.id, user]))

let currentSession: Session | null = null

export const db = {
  users: USERS,

  setSession(role: Role | null): Session | null {
    currentSession =
      role === null
        ? null
        : {
            user: USERS[role],
            expiresAt: new Date(Date.now() + 8 * 3_600_000).toISOString(),
          }
    return currentSession
  },

  getSession(): Session | null {
    return currentSession
  },

  listCases(query: CaseListQuery): CaseListResponse {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(10, query.page_size ?? 25))
    const search = query.q?.trim().toLowerCase()

    let filtered = cases.filter((item) => {
      if (query.status && item.status !== query.status) return false
      if (query.queue && item.queue !== query.queue) return false
      if (query.view === 'mine' && item.assignee?.id !== currentSession?.user.id) return false
      if (query.view === 'unassigned' && item.assignee !== null) return false
      if (search) {
        const haystack = `${item.code} ${item.subject} ${item.customer.name}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    const sort = query.sort ?? '-updated_at'
    const priorityRank: Record<string, number> = { low: 0, normal: 1, high: 2, urgent: 3 }
    filtered = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'created_at':
          return a.createdAt.localeCompare(b.createdAt)
        case '-created_at':
          return b.createdAt.localeCompare(a.createdAt)
        case 'updated_at':
          return a.updatedAt.localeCompare(b.updatedAt)
        case '-priority':
          return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
        default:
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    })

    const total = filtered.length
    const start = (page - 1) * pageSize

    return {
      items: filtered.slice(start, start + pageSize),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    }
  },

  listCustomers(query: CustomerListQuery): CustomerListResponse {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(10, query.page_size ?? 25))
    const search = query.q?.trim().toLowerCase()

    const filtered = search
      ? customers.filter((item) => `${item.name} ${item.city}`.toLowerCase().includes(search))
      : customers

    const total = filtered.length
    const start = (page - 1) * pageSize

    return {
      items: filtered.slice(start, start + pageSize),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    }
  },

  getCustomer(customerId: string): CustomerProfile | null {
    return customersById.get(customerId) ?? null
  },

  getCase(caseId: string): Case | null {
    return casesById.get(caseId) ?? null
  },

  getSummary(): CaseSummary {
    const openCases = cases.filter((item) => item.status === 'open' || item.status === 'pending')
    const now = new Date().toISOString()

    return {
      queues: Object.fromEntries(
        MASTER_DATA.queues.map(({ code }) => [
          code,
          openCases.filter((item) => item.queue === code).length,
        ]),
      ),
      unassigned: openCases.filter((item) => item.assignee === null).length,
      overdue: openCases.filter((item) => item.slaDueAt != null && item.slaDueAt < now).length,
    }
  },

  updateCase(caseId: string, patch: UpdateCaseRequest, actor: User): Case | null {
    const item = casesById.get(caseId)
    if (!item) return null

    if (patch.status) item.status = patch.status
    if (patch.queue) item.queue = patch.queue
    if (patch.priority) item.priority = patch.priority
    if (patch.assigneeId !== undefined) {
      item.assignee = patch.assigneeId ? (usersById.get(patch.assigneeId) ?? null) : null
    }

    item.updatedAt = new Date().toISOString()
    item.timeline = [
      ...item.timeline,
      {
        id: `entry-${Date.now()}`,
        type: patch.status ? 'status_change' : 'assignment',
        author: actor,
        body: patch.status
          ? `Status diubah menjadi ${patch.status}.`
          : `Case di-assign ke ${item.assignee?.name ?? 'tanpa PIC'}.`,
        visibility: 'internal',
        createdAt: item.updatedAt,
      },
    ]

    return { ...item }
  },

  addReply(caseId: string, body: CreateReplyRequest, actor: User): TimelineEntry | null {
    const item = casesById.get(caseId)
    if (!item) return null

    const entry: TimelineEntry = {
      id: `entry-${Date.now()}-${Math.floor(random() * 1000)}`,
      type: body.visibility === 'internal' ? 'note' : 'reply',
      author: actor,
      body: body.body,
      visibility: body.visibility,
      createdAt: new Date().toISOString(),
    }

    item.timeline = [...item.timeline, entry]
    item.updatedAt = entry.createdAt
    return entry
  },
}
