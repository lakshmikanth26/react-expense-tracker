export * from './database'

/** Standard shape passed through the UI whenever an async action can fail. */
export interface AppError {
  message: string
  cause?: unknown
}
