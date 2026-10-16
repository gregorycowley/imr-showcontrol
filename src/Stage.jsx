import { useState } from 'react'
import { CastStrip, readDrop, writeSpanDrag } from './Cast.jsx'
import { memberById, spanAt } from './show.js'

// Faces from svgs/room-view-wide.svg. The drawing's region_01 … region_10
// are timeline layers 1 … 10.
const ROOM_LINES = [
  'M18.4,490V10',
  'M1892,10v480',
  'M401.5,100h1107.5v300H401.5V100Z',
  'M18.4,10l383.1,90M1892,10l-383.1,90M18.4,490l383.1-90M1892,490l-383.1-90',
]

const FACES = [
  { region: 1, points: '1685.1 119.8 1562.6 139.4 1562.6 243.5 1685.1 242.3 1685.1 119.8' },
  { region: 2, points: '1846 250 1731.1 250 1731.1 387.5 1846 405.9 1846 250' },
  { region: 3, points: '1208.9 259 1457.9 259 1457.9 376 1208.9 376 1208.9 259' },
  { region: 4, points: '452.5 259 663 259 663 376 452.5 376 452.5 259' },
  { region: 5, points: '685.5 259 934.5 259 934.5 376 685.5 376 685.5 259' },
  { region: 6, points: '1303 124 1479 124 1479 241 1303 241 1303 124' },
  { region: 7, points: '981 124 1230 124 1230 241 981 241 981 124' },
  { region: 8, points: '452.5 124 892 124 892 241 452.5 241 452.5 124' },
  { region: 9, points: '217.6 257.7 340.2 256.6 340.2 368.4 217.6 389.1 217.6 257.7' },
  { region: 10, points: '64.4 85 179.3 104.4 179.3 233.8 64.4 231.7 64.4 85' },
].map((face) => {
  const nums = face.points.split(/[\s,]+/).map(Number)
  const coords = []
  for (let i = 0; i < nums.length; i += 2) coords.push([nums[i], nums[i + 1]])
  const [fx, fy] = coords[0]
  const [lx, ly] = coords[coords.length - 1]
  if (fx === lx && fy === ly) coords.pop()
  const xs = coords.map(([x]) => x)
  const ys = coords.map(([, y]) => y)
  return {
    region: face.region,
    points: coords.map(([x, y]) => `${x},${y}`).join(' '),
    cx: xs.reduce((a, b) => a + b, 0) / xs.length,
    cy: ys.reduce((a, b) => a + b, 0) / ys.length,
    width: Math.max(...xs) - Math.min(...xs),
  }
})

const NUMBER_SIZE = 32
const LABEL_SIZE = 26

function fit(text, width) {
  const max = Math.max(3, Math.floor(width / (LABEL_SIZE * 0.55)))
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function isDark(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!match) return false
  const value = parseInt(match[1], 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return 0.299 * r + 0.587 * g + 0.114 * b < 140
}

function Face({ face, member, span, droppable, onDrop, onDragKind }) {
  const [over, setOver] = useState(false)
  const classes = ['face']
  if (!member) classes.push('face-off')
  if (droppable) classes.push('face-droppable')
  if (over) classes.push('face-over')

  let fill = member?.kind === 'color' ? member.value : undefined
  let label = ''
  if (member?.kind === 'video') label = member.name
  if (member?.kind === 'text') label = member.value

  return (
    <g
      className={classes.join(' ')}
      draggable={Boolean(span)}
      onDragStart={(event) => {
        if (!span) return
        writeSpanDrag(event.dataTransfer, span.id)
        onDragKind('span')
      }}
      onDragEnd={() => onDragKind(null)}
      onDragOver={(event) => {
        const types = [...event.dataTransfer.types]
        const moving = types.includes('application/x-score-span')
        const copying = types.includes('application/x-cast-member') || types.includes('text/plain')
        if (!droppable && !moving && !copying) return
        event.preventDefault()
        event.dataTransfer.dropEffect = moving ? 'move' : 'copy'
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        onDrop(readDrop(event))
      }}
    >
      <polygon points={face.points} style={fill ? { fill } : undefined} />
      <text
        className="face-number"
        x={face.cx}
        y={label ? face.cy - NUMBER_SIZE * 0.7 : face.cy}
        fontSize={NUMBER_SIZE}
        style={fill && isDark(fill) ? { fill: '#fff' } : undefined}
      >
        {face.region}
      </text>
      {label ? (
        <text
          className="face-label"
          x={face.cx}
          y={face.cy + LABEL_SIZE * 0.7}
          fontSize={LABEL_SIZE}
          style={fill && isDark(fill) ? { fill: '#fff' } : undefined}
        >
          {fit(label, face.width)}
        </text>
      ) : null}
    </g>
  )
}

export function Stage({ show, dragKind, onDragKind, onAddMember, onRemoveMember, onDrop }) {
  const droppable = dragKind === 'member' || dragKind === 'span'

  return (
    <section className="panel stage" aria-label="Stage">
      <h2>Stage</h2>
      <div className="stage-body">
      <div className="stage-preview">
        <svg viewBox="0 0 1920 500" className="room" role="img" aria-label="Room preview">
          <g className="room-lines">
            {ROOM_LINES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {FACES.map((face) => {
            const span = show ? spanAt(show, face.region, show.playhead) : null
            return (
              <Face
                key={face.region}
                face={face}
                span={span}
                member={span ? memberById(show, span.memberId) : null}
                droppable={droppable}
                onDragKind={onDragKind}
                onDrop={(drag) => onDrop(face.region, drag)}
              />
            )
          })}
          <g className="room-middle">
            <line x1="955.2" y1="10" x2="955.2" y2="16" />
            <line className="room-middle-dash" x1="955.2" y1="28" x2="955.2" y2="478" />
            <line x1="955.2" y1="484" x2="955.2" y2="490" />
          </g>
        </svg>
      </div>
      <CastStrip
        cast={show?.cast ?? []}
        disabled={!show}
        onAdd={onAddMember}
        onRemove={onRemoveMember}
        onDragKind={onDragKind}
      />
      </div>
    </section>
  )
}
