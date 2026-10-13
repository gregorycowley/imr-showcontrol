import { useState } from 'react'
import { KINDS, canPlace, createMember } from './show.js'

const DRAG_TYPE = 'application/x-cast-member'

export function readDraggedMemberId(event) {
  return event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData('text/plain')
}

function kindMark(member) {
  if (member.kind === 'color') {
    return <span className="chip-swatch" style={{ background: member.value }} aria-label="Color" />
  }
  const labels = { video: 'VID', sound: 'SND', text: 'TXT' }
  return <span className="chip-kind">{labels[member.kind]}</span>
}

function chipDetail(member) {
  if (member.kind === 'text') return member.value
  if (member.kind === 'color') return member.value
  return member.path
}

function AddMemberForm({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('video')
  const [path, setPath] = useState('')
  const [text, setText] = useState('')
  const [color, setColor] = useState('#1e88e5')

  const needsPath = kind === 'video' || kind === 'sound'
  const valid = name.trim() && (!needsPath || path.trim()) && (kind !== 'text' || text.trim())

  function submit(event) {
    event.preventDefault()
    if (!valid) return
    onAdd(createMember({ name, kind, path, value: kind === 'text' ? text : kind === 'color' ? color : '' }))
    onClose()
  }

  return (
    <form className="cast-form" onSubmit={submit}>
      <label>
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </label>
      <label>
        <span>Kind</span>
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          {KINDS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {needsPath ? (
        <label className="cast-form-wide">
          <span>Path</span>
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="media/clip.mp4"
          />
        </label>
      ) : null}
      {kind === 'text' ? (
        <label className="cast-form-wide">
          <span>Text</span>
          <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      ) : null}
      {kind === 'color' ? (
        <label>
          <span>Color</span>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
      ) : null}
      <button type="submit" disabled={!valid}>
        Add
      </button>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
    </form>
  )
}

export function CastStrip({ cast, disabled, onAdd, onRemove, onDragChange }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="cast-strip" aria-label="Cast">
      <div className="cast-head">
        <span className="cast-title">Cast</span>
        {adding ? null : (
          <button type="button" onClick={() => setAdding(true)} disabled={disabled}>
            Add member
          </button>
        )}
      </div>
      {adding ? (
        <AddMemberForm onAdd={onAdd} onClose={() => setAdding(false)} />
      ) : (
        <ul className="cast-list">
          {cast.length === 0 ? <li className="cast-empty">No cast members yet.</li> : null}
          {cast.map((member) => (
            <li
              key={member.id}
              className={`chip chip-${member.kind}`}
              draggable={canPlace(member)}
              title={canPlace(member) ? chipDetail(member) : 'Sound members go on audio lanes in a later phase.'}
              onDragStart={(event) => {
                event.dataTransfer.setData(DRAG_TYPE, member.id)
                event.dataTransfer.setData('text/plain', member.id)
                event.dataTransfer.effectAllowed = 'copy'
                onDragChange(member.id)
              }}
              onDragEnd={() => onDragChange(null)}
            >
              <span className="chip-number">{member.number}</span>
              {kindMark(member)}
              <span className="chip-name">{member.name}</span>
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${member.name}`}
                onClick={() => onRemove(member.id)}
                disabled={disabled}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
