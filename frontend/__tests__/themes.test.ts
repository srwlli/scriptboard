import {
  themes,
  modes,
  DEFAULT_THEME,
  DEFAULT_MODE,
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  getThemeById,
  getModeById,
  isValidTheme,
  isValidMode,
} from '@/components/theme/themes'

describe('Theme Registry', () => {
  describe('Constants', () => {
    it('exports DEFAULT_THEME as "default"', () => {
      expect(DEFAULT_THEME).toBe('default')
    })

    it('exports DEFAULT_MODE as "system"', () => {
      expect(DEFAULT_MODE).toBe('system')
    })

    it('exports THEME_STORAGE_KEY as "app-theme"', () => {
      expect(THEME_STORAGE_KEY).toBe('app-theme')
    })

    it('exports MODE_STORAGE_KEY as "app-mode"', () => {
      expect(MODE_STORAGE_KEY).toBe('app-mode')
    })
  })

  describe('Themes Array', () => {
    it('contains at least one theme', () => {
      expect(themes.length).toBeGreaterThan(0)
    })

    it('contains Default theme', () => {
      const defaultTheme = themes.find(t => t.id === 'default')
      expect(defaultTheme).toBeDefined()
      expect(defaultTheme?.name).toBe('Default')
      expect(defaultTheme?.description).toBe('Clean and minimal')
    })

    it('all themes have required properties', () => {
      themes.forEach(theme => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('description')
        expect(theme).toHaveProperty('icon')
        expect(typeof theme.id).toBe('string')
        expect(typeof theme.name).toBe('string')
        expect(typeof theme.description).toBe('string')
        expect(typeof theme.icon).toBe('string')
      })
    })
  })

  describe('Modes Array', () => {
    it('contains exactly 3 modes', () => {
      expect(modes).toHaveLength(3)
    })

    it('contains light, dark, and system modes', () => {
      const modeIds = modes.map(m => m.id)
      expect(modeIds).toContain('light')
      expect(modeIds).toContain('dark')
      expect(modeIds).toContain('system')
    })

    it('all modes have required properties', () => {
      modes.forEach(mode => {
        expect(mode).toHaveProperty('id')
        expect(mode).toHaveProperty('label')
        expect(mode).toHaveProperty('icon')
        expect(typeof mode.id).toBe('string')
        expect(typeof mode.label).toBe('string')
        expect(['Sun', 'Moon', 'Monitor']).toContain(mode.icon)
      })
    })
  })

  describe('getThemeById', () => {
    it('returns theme for valid id', () => {
      const theme = getThemeById('default')
      expect(theme).toBeDefined()
      expect(theme?.id).toBe('default')
    })

    it('returns undefined for invalid id', () => {
      const theme = getThemeById('invalid' as any)
      expect(theme).toBeUndefined()
    })
  })

  describe('getModeById', () => {
    it('returns mode for valid id', () => {
      const light = getModeById('light')
      const dark = getModeById('dark')
      const system = getModeById('system')

      expect(light).toBeDefined()
      expect(light?.id).toBe('light')
      expect(dark).toBeDefined()
      expect(dark?.id).toBe('dark')
      expect(system).toBeDefined()
      expect(system?.id).toBe('system')
    })

    it('returns undefined for invalid id', () => {
      const mode = getModeById('invalid' as any)
      expect(mode).toBeUndefined()
    })
  })

  describe('isValidTheme', () => {
    it('returns true for valid theme id', () => {
      expect(isValidTheme('default')).toBe(true)
    })

    it('returns false for invalid theme id', () => {
      expect(isValidTheme('invalid')).toBe(false)
      expect(isValidTheme('')).toBe(false)
    })
  })

  describe('isValidMode', () => {
    it('returns true for valid mode ids', () => {
      expect(isValidMode('light')).toBe(true)
      expect(isValidMode('dark')).toBe(true)
      expect(isValidMode('system')).toBe(true)
    })

    it('returns false for invalid mode id', () => {
      expect(isValidMode('invalid')).toBe(false)
      expect(isValidMode('')).toBe(false)
    })
  })
})

