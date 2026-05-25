export const log = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args)
}

export const isDev = () => process.env.NODE_ENV === 'development'

export function safeErrorMessage(error, fallback = 'An error occurred') {
  return isDev() ? (error?.message || fallback) : fallback
}
