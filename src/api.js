export async function loadShow() {
  const response = await fetch('/api/show')
  if (!response.ok) {
    throw new Error('Could not read show.json')
  }
  return response.json()
}

export async function saveShow(show) {
  const response = await fetch('/api/show', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(show),
  })
  if (!response.ok) {
    throw new Error('Could not write show.json')
  }
  return response.json()
}
