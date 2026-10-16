// Phase 1 show model: cast members, ten region layers, spans, and the playhead.

export const FRAME_COUNT = 30
export const REGION_COUNT = 10
export const REGIONS = Array.from({ length: REGION_COUNT }, (_, index) => index + 1)

export const KINDS = [
  { id: 'video', label: 'Video' },
  { id: 'sound', label: 'Sound' },
  { id: 'text', label: 'Text' },
  { id: 'color', label: 'Color' },
]

const KIND_IDS = new Set(KINDS.map((kind) => kind.id))

export function clampFrame(frame) {
  const value = Math.round(Number(frame))
  if (!Number.isFinite(value)) return 1
  return Math.min(FRAME_COUNT, Math.max(1, value))
}

export function emptyShow() {
  return {
    cast: [],
    score: { regions: REGIONS.map((region) => ({ region, spans: [] })) },
    playhead: 1,
  }
}

function isMember(member) {
  return (
    member &&
    typeof member.id === 'string' &&
    typeof member.name === 'string' &&
    KIND_IDS.has(member.kind)
  )
}

function isSpan(span, memberIds) {
  return (
    span &&
    typeof span.id === 'string' &&
    memberIds.has(span.memberId) &&
    Number.isInteger(span.start) &&
    span.start >= 1 &&
    span.start <= FRAME_COUNT
  )
}

// Accepts whatever is in show.json and returns a well-formed Phase 1 show.
export function normalizeShow(data) {
  const cast = Array.isArray(data?.cast) ? data.cast.filter(isMember) : []
  const memberIds = new Set(cast.map((member) => member.id))
  const numbered = cast.map((member, index) => ({
    ...member,
    number: Number.isInteger(member.number) ? member.number : index + 1,
  }))

  const regions = REGIONS.map((region) => {
    const found = data?.score?.regions?.find((entry) => entry?.region === region)
    const spans = Array.isArray(found?.spans)
      ? found.spans
          .filter((span) => isSpan(span, memberIds))
          .map((span) => ({
            id: span.id,
            memberId: span.memberId,
            start: span.start,
            length: Number.isInteger(span.length) && span.length > 0 ? span.length : 1,
          }))
      : []
    return { region, spans }
  })

  return {
    cast: numbered,
    score: { regions },
    playhead: clampFrame(data?.playhead ?? 1),
  }
}

export function memberById(show, id) {
  return show.cast.find((member) => member.id === id) ?? null
}

export function regionSpans(show, region) {
  return show.score.regions.find((entry) => entry.region === region)?.spans ?? []
}

// Hold rule: the span with the latest start at or before this frame.
export function spanAt(show, region, frame) {
  let current = null
  for (const span of regionSpans(show, region)) {
    if (span.start <= frame && (!current || span.start > current.start)) {
      current = span
    }
  }
  return current
}

export function memberAt(show, region, frame) {
  const span = spanAt(show, region, frame)
  return span ? memberById(show, span.memberId) : null
}

export function canPlace(member) {
  return Boolean(member) && member.kind !== 'sound'
}

export function spanById(show, id) {
  for (const entry of show.score.regions) {
    const span = entry.spans.find((item) => item.id === id)
    if (span) return { region: entry.region, span }
  }
  return null
}

// Moves a span to another layer and frame. Dropping on a frame that already
// starts a span swaps the two. Omitting frame keeps the span's start.
export function moveSpan(show, spanId, region, frame) {
  const found = spanById(show, spanId)
  if (!found) return show
  const start = frame == null ? found.span.start : clampFrame(frame)
  const dest = show.score.regions.find((entry) => entry.region === region)
  const occupant = dest?.spans.find((span) => span.id !== spanId && span.start === start) ?? null
  if (!occupant && found.region === region && found.span.start === start) return show

  return {
    ...show,
    score: {
      regions: show.score.regions.map((entry) => {
        let spans = entry.spans.filter((span) => span.id !== spanId && span.id !== occupant?.id)
        if (entry.region === region) spans = [...spans, { ...found.span, start }]
        if (occupant && entry.region === found.region) {
          spans = [...spans, { ...occupant, start: found.span.start }]
        }
        spans.sort((a, b) => a.start - b.start)
        return { region: entry.region, spans }
      }),
    },
  }
}

export function applyTimelineDrop(show, region, frame, drag) {
  const spanId = drag.spanId || (spanById(show, drag.memberId) ? drag.memberId : null)
  if (spanId) return moveSpan(show, spanId, region, frame)
  if (drag.memberId) return placeMember(show, region, frame, drag.memberId)
  return show
}

export function applyStageDrop(show, region, drag) {
  const spanId = drag.spanId || (spanById(show, drag.memberId) ? drag.memberId : null)
  if (spanId) return moveSpan(show, spanId, region)
  if (drag.memberId) return placeMember(show, region, show.playhead, drag.memberId)
  return show
}

// Creates or replaces the span that starts at this frame on this region.
export function placeMember(show, region, frame, memberId) {
  const member = memberById(show, memberId)
  if (!canPlace(member)) return show
  const start = clampFrame(frame)
  return {
    ...show,
    score: {
      regions: show.score.regions.map((entry) => {
        if (entry.region !== region) return entry
        const kept = entry.spans.filter((span) => span.start !== start)
        return {
          region,
          spans: [...kept, { id: crypto.randomUUID(), memberId, start, length: 1 }].sort(
            (a, b) => a.start - b.start,
          ),
        }
      }),
    },
  }
}

export function createMember({ name, kind, path = '', value = '' }) {
  const member = { id: crypto.randomUUID(), name: name.trim(), kind }
  if (kind === 'video' || kind === 'sound') member.path = path.trim()
  if (kind === 'text' || kind === 'color') member.value = value
  return member
}

export function addMember(show, member) {
  const number = show.cast.reduce((max, entry) => Math.max(max, entry.number), 0) + 1
  return { ...show, cast: [...show.cast, { ...member, number }] }
}

export function removeMember(show, id) {
  return {
    ...show,
    cast: show.cast.filter((member) => member.id !== id),
    score: {
      regions: show.score.regions.map((entry) => ({
        region: entry.region,
        spans: entry.spans.filter((span) => span.memberId !== id),
      })),
    },
  }
}

export function setPlayhead(show, frame) {
  return { ...show, playhead: clampFrame(frame) }
}

export function showIsBlank(show) {
  return show.cast.length === 0 && show.score.regions.every((entry) => entry.spans.length === 0)
}

// Reads a saved show file. A file that is not a show is rejected so Load
// cannot replace the open show with an empty one.
export function parseShowText(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not a show.')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.cast)) {
    throw new Error('That file is not a show.')
  }
  return normalizeShow(data)
}
