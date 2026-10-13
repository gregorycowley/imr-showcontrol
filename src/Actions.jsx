export function Actions({ error }) {
  return (
    <section className="panel actions" aria-label="Actions">
      <h2>Actions</h2>
      <div className="actions-body">
        <p className="placeholder">Trigger and mapping cards arrive in a later phase.</p>
        {error ? <p className="save-error">{error}</p> : null}
      </div>
    </section>
  )
}
