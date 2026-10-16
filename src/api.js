const LOCAL_SHOW = 'show-control.show'

export async function loadShow() {
  if (import.meta.env.PROD) {
    const stored = localStorage.getItem(LOCAL_SHOW)
    if (stored) return JSON.parse(stored)
    const response = await fetch('/show.json')
    if (!response.ok) throw new Error('Could not read show.json')
    return response.json()
  }
  const response = await fetch('/api/show')
  if (!response.ok) {
    throw new Error('Could not read show.json')
  }
  return response.json()
}

export function downloadShow(show) {
  const blob = new Blob([`${JSON.stringify(show, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'show.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function saveShow(show) {
  if (import.meta.env.PROD) {
    localStorage.setItem(LOCAL_SHOW, JSON.stringify(show))
    return show
  }
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
