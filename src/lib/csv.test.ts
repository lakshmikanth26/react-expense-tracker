import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('joins fields with commas and rows with CRLF', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a,b\r\nc,d')
  })

  it('quotes fields containing a comma', () => {
    expect(toCsv([['Groceries, weekly']])).toBe('"Groceries, weekly"')
  })

  it('quotes and escapes fields containing a double quote', () => {
    expect(toCsv([['Say "hi"']])).toBe('"Say ""hi"""')
  })

  it('quotes fields containing a newline', () => {
    expect(toCsv([['line one\nline two']])).toBe('"line one\nline two"')
  })

  it('leaves plain fields unquoted', () => {
    expect(toCsv([['Food', '500']])).toBe('Food,500')
  })
})
