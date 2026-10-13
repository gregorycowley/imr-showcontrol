import { useState } from 'react'
import { CastStrip, readDraggedMemberId } from './Cast.jsx'
import { canPlace, memberAt, memberById } from './show.js'

// Fixed projection faces in the room drawing (viewBox from svgs/room-view.svg).
// Order: left wall, back wall, right wall, ceiling, floor.
const FACES = [
  { region: 1, points: '91.6,135 145.6,154.4 145.6,283.8 91.6,281.7' },
  { region: 2, points: '163.6,307.7 221.2,306.6 221.2,418.4 163.6,439.1' },
  { region: 3, points: '274,174 391,174 391,291 274,291' },
  { region: 4, points: '409,174 526,174 526,291 409,291' },
  { region: 5, points: '274,309 391,309 391,426 274,426' },
  { region: 6, points: '409,309 526,309 526,426 409,426' },
  { region: 7, points: '632.8,169.8 575.2,189.4 575.2,293.5 632.8,292.3' },
  { region: 8, points: '708.4,300 654.4,300 654.4,437.5 708.4,455.9' },
  { region: 9, points: '240,80 560,80 500,130 300,130' },
  { region: 10, points: '300,470 500,470 560,520 240,520' },
].map((face) => {
  const coords = face.points.split(' ').map((pair) => pair.split(',').map(Number))
  const xs = coords.map(([x]) => x)
  const ys = coords.map(([, y]) => y)
  return {
    ...face,
    cx: xs.reduce((a, b) => a + b, 0) / xs.length,
    cy: ys.reduce((a, b) => a + b, 0) / ys.length,
    width: Math.max(...xs) - Math.min(...xs),
  }
})

const LABEL_SIZE = 16

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

function Face({ face, member, droppable, onDrop }) {
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
      onDragOver={(event) => {
        if (!droppable) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        onDrop(readDraggedMemberId(event))
      }}
    >
      <polygon points={face.points} style={fill ? { fill } : undefined} />
      <text
        className="face-number"
        x={face.cx}
        y={label ? face.cy - LABEL_SIZE * 0.9 : face.cy}
        style={fill && isDark(fill) ? { fill: '#fff' } : undefined}
      >
        {face.region}
      </text>
      {label ? (
        <text
          className="face-label"
          x={face.cx}
          y={face.cy + LABEL_SIZE * 0.6}
          style={fill && isDark(fill) ? { fill: '#fff' } : undefined}
        >
          {fit(label, face.width)}
        </text>
      ) : null}
    </g>
  )
}

export function Stage({ show, onAddMember, onRemoveMember, onPlace }) {
  const [dragging, setDragging] = useState(null)
  const draggingMember = show && dragging ? memberById(show, dragging) : null
  const droppable = canPlace(draggingMember)

  return (
    <section className="panel stage" aria-label="Stage">
      <h2>Stage</h2>
      <div className="stage-preview">
        <svg viewBox="60 50 680 500" className="room" role="img" aria-label="Room preview">
          <g className="room-lines">
            <path d="M70 60 H730 V540 H70 Z" />
            <path d="M250 150 H550 V450 H250 Z" />
            <path d="M70 60 L250 150 M730 60 L550 150 M70 540 L250 450 M730 540 L550 450" />
          </g>
          {FACES.map((face) => (
            <Face
              key={face.region}
              face={face}
              member={show ? memberAt(show, face.region, show.playhead) : null}
              droppable={droppable}
              onDrop={(memberId) => {
                if (memberId) onPlace(face.region, memberId)
              }}
            />
          ))}
        </svg>
      </div>
      <CastStrip
        cast={show?.cast ?? []}
        disabled={!show}
        onAdd={onAddMember}
        onRemove={onRemoveMember}
        onDragChange={setDragging}
      />
    </section>
  )
}
