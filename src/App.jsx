import { useEffect, useRef, useState } from 'react'
import { downloadShow, loadShow, saveShow } from './api.js'
import { Actions } from './Actions.jsx'
import { Stage } from './Stage.jsx'
import { Timeline } from './Timeline.jsx'
import {
  addMember,
  normalizeShow,
  parseShowText,
  applyStageDrop,
  applyTimelineDrop,
  removeMember,
  setPlayhead,
  showIsBlank,
} from './show.js'
import './App.css'

export default function App() {
  const [show, setShow] = useState(null)
  const [error, setError] = useState('')
  const [dragKind, setDragKind] = useState(null)
  const saved = useRef('')

  useEffect(() => {
    let active = true
    loadShow()
      .then((data) => {
        if (!active) return
        const normalized = normalizeShow(data)
        saved.current = JSON.stringify(normalized)
        setShow(normalized)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!show) return undefined
    const text = JSON.stringify(show)
    if (text === saved.current) return undefined

    const timer = setTimeout(() => {
      saveShow(show)
        .then(() => {
          saved.current = text
          setError('')
        })
        .catch((saveError) => setError(saveError.message))
    }, 300)

    return () => clearTimeout(timer)
  }, [show])

  const update = (fn) => setShow((current) => (current ? fn(current) : current))

  async function loadFile(file) {
    try {
      const next = parseShowText(await file.text())
      if (
        show &&
        !showIsBlank(show) &&
        !window.confirm('Replace the current show with this file?')
      ) {
        return
      }
      setError('')
      setShow(next)
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  return (
    <main className="layout">
      <Stage
        show={show}
        dragKind={dragKind}
        onDragKind={setDragKind}
        onAddMember={(member) => update((current) => addMember(current, member))}
        onRemoveMember={(id) => update((current) => removeMember(current, id))}
        onDrop={(region, drag) => update((current) => applyStageDrop(current, region, drag))}
      />
      <Timeline
        show={show}
        dragKind={dragKind}
        onDragKind={setDragKind}
        onPlayhead={(frame) => update((current) => setPlayhead(current, frame))}
        onDrop={(region, frame, drag) =>
          update((current) => applyTimelineDrop(current, region, frame, drag))
        }
      />
      <Actions
        error={error}
        canSave={Boolean(show)}
        onLoad={loadFile}
        onSave={() => show && downloadShow(show)}
      />
    </main>
  )
}
