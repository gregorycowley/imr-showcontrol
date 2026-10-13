import { useEffect, useRef, useState } from 'react'
import { loadShow, saveShow } from './api.js'
import { Actions } from './Actions.jsx'
import { Stage } from './Stage.jsx'
import { Timeline } from './Timeline.jsx'
import { addMember, normalizeShow, placeMember, removeMember, setPlayhead } from './show.js'
import './App.css'

export default function App() {
  const [show, setShow] = useState(null)
  const [error, setError] = useState('')
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

  return (
    <main className="layout">
      <Stage
        show={show}
        onAddMember={(member) => update((current) => addMember(current, member))}
        onRemoveMember={(id) => update((current) => removeMember(current, id))}
        onPlace={(region, memberId) =>
          update((current) => placeMember(current, region, current.playhead, memberId))
        }
      />
      <Timeline show={show} onPlayhead={(frame) => update((current) => setPlayhead(current, frame))} />
      <Actions error={error} />
    </main>
  )
}
