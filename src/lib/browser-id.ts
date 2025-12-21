import { v4 as uuidv4 } from 'uuid'

const BROWSER_ID_KEY = 'christmas-map-browser-id'

export function getBrowserId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let browserId = localStorage.getItem(BROWSER_ID_KEY)

  if (!browserId) {
    browserId = uuidv4()
    localStorage.setItem(BROWSER_ID_KEY, browserId)
  }

  return browserId
}
