import { useRef } from 'react'

export function Actions({ error, onLoad, onSave, canSave }) {
  const input = useRef(null)

  return (
    <section className="panel actions" aria-label="Actions">
      <h2>Actions</h2>
      <div className="actions-body">
        <div className="file-actions">
          <button type="button" onClick={() => input.current?.click()}>
            Load
          </button>
          <button type="button" onClick={onSave} disabled={!canSave}>
            Save
          </button>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onLoad(file)
            }}
          />
        </div>
        <p className="placeholder">Trigger and mapping cards arrive in a later phase.</p>
        {error ? <p className="save-error">{error}</p> : null}
      </div>
    </section>
  )
}
