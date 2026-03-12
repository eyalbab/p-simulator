import axios from 'axios'

type ErrorResponseData = {
  message?: string | string[]
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ErrorResponseData>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string') {
      return message
    }
  }

  return 'An unexpected error occurred. Please try again.'
}
