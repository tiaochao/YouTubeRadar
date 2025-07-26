import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'true-class', false && 'false-class')).toBe('base true-class')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', null, undefined, 'end')).toBe('base end')
    })
  })
})