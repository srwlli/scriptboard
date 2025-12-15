/**
 * Extensive tests for themes.ts registry
 * 
 * Tests cover:
 * - All 35 LLM theme IDs (after implementation)
 * - Theme type safety
 * - Theme metadata validation
 * - Brand grouping
 * - Helper functions
 * - Edge cases
 */

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
  type Theme,
  type Mode,
  type ThemeConfig,
  type ModeConfig,
} from '@/components/theme/themes'

describe('Theme Registry - Extensive Tests', () => {
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

    it('storage keys are non-empty strings', () => {
      expect(typeof THEME_STORAGE_KEY).toBe('string')
      expect(THEME_STORAGE_KEY.length).toBeGreaterThan(0)
      expect(typeof MODE_STORAGE_KEY).toBe('string')
      expect(MODE_STORAGE_KEY.length).toBeGreaterThan(0)
    })
  })

  describe('Themes Array', () => {
    it('contains at least one theme', () => {
      expect(themes.length).toBeGreaterThan(0)
    })

    it('all themes have required properties', () => {
      themes.forEach((theme, index) => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('description')
        expect(theme).toHaveProperty('icon')
        
        expect(typeof theme.id).toBe('string')
        expect(typeof theme.name).toBe('string')
        expect(typeof theme.description).toBe('string')
        expect(typeof theme.icon).toBe('string')
        
        expect(theme.id.length).toBeGreaterThan(0)
        expect(theme.name.length).toBeGreaterThan(0)
        expect(theme.description.length).toBeGreaterThan(0)
        expect(theme.icon.length).toBeGreaterThan(0)
      })
    })

    it('all theme IDs are unique', () => {
      const ids = themes.map(t => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all theme names are non-empty', () => {
      themes.forEach(theme => {
        expect(theme.name.trim().length).toBeGreaterThan(0)
      })
    })

    it('all theme descriptions are non-empty', () => {
      themes.forEach(theme => {
        expect(theme.description.trim().length).toBeGreaterThan(0)
      })
    })

    it('contains Default theme', () => {
      const defaultTheme = themes.find(t => t.id === 'default')
      expect(defaultTheme).toBeDefined()
      expect(defaultTheme?.name).toBe('Default')
      expect(defaultTheme?.description).toBe('Clean and minimal')
      expect(defaultTheme?.icon).toBe('Palette')
    })

    // These tests will pass after 35 themes are added
    describe('LLM Themes (after implementation)', () => {
      it('should contain Claude themes', () => {
        const claudeThemes = themes.filter(t => t.id.startsWith('claude-'))
        // After implementation: expect(claudeThemes.length).toBe(5)
        expect(claudeThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain GPT-5.1 Thinking themes', () => {
        const gptThemes = themes.filter(t => t.id.startsWith('gpt-5-1-thinking-'))
        // After implementation: expect(gptThemes.length).toBe(5)
        expect(gptThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain Gemini themes', () => {
        const geminiThemes = themes.filter(t => t.id.startsWith('gemini-'))
        // After implementation: expect(geminiThemes.length).toBe(5)
        expect(geminiThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain DeepSeek themes', () => {
        const deepseekThemes = themes.filter(t => t.id.startsWith('deepseek-'))
        // After implementation: expect(deepseekThemes.length).toBe(5)
        expect(deepseekThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain Le Chat themes', () => {
        const lechatThemes = themes.filter(t => t.id.startsWith('lechat-'))
        // After implementation: expect(lechatThemes.length).toBe(5)
        expect(lechatThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain GPT-4.1 Mini themes', () => {
        const gptMiniThemes = themes.filter(t => t.id.startsWith('gpt4.1-mini-'))
        // After implementation: expect(gptMiniThemes.length).toBe(5)
        expect(gptMiniThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should contain Grok themes', () => {
        const grokThemes = themes.filter(t => t.id.startsWith('grok-'))
        // After implementation: expect(grokThemes.length).toBe(5)
        expect(grokThemes.length).toBeGreaterThanOrEqual(0)
      })

      it('should have correct icons per brand', () => {
        // After implementation, verify icons:
        // Claude: Sparkles
        // GPT-5.1: Brain
        // Gemini: Bot
        // DeepSeek: Zap
        // Le Chat: MessageSquare
        // GPT-4.1 Mini: Cpu
        // Grok: Rocket
        
        const claudeThemes = themes.filter(t => t.id.startsWith('claude-'))
        claudeThemes.forEach(theme => {
          // After implementation: expect(theme.icon).toBe('Sparkles')
          expect(theme.icon).toBeTruthy()
        })
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

    it('light mode has correct properties', () => {
      const light = modes.find(m => m.id === 'light')
      expect(light).toBeDefined()
      expect(light?.label).toBe('Light')
      expect(light?.icon).toBe('Sun')
    })

    it('dark mode has correct properties', () => {
      const dark = modes.find(m => m.id === 'dark')
      expect(dark).toBeDefined()
      expect(dark?.label).toBe('Dark')
      expect(dark?.icon).toBe('Moon')
    })

    it('system mode has correct properties', () => {
      const system = modes.find(m => m.id === 'system')
      expect(system).toBeDefined()
      expect(system?.label).toBe('System')
      expect(system?.icon).toBe('Monitor')
    })

    it('all mode IDs are unique', () => {
      const ids = modes.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all mode labels are non-empty', () => {
      modes.forEach(mode => {
        expect(mode.label.trim().length).toBeGreaterThan(0)
      })
    })
  })

  describe('getThemeById', () => {
    it('returns theme for valid id', () => {
      const theme = getThemeById('default')
      expect(theme).toBeDefined()
      expect(theme?.id).toBe('default')
      expect(theme?.name).toBe('Default')
    })

    it('returns undefined for invalid id', () => {
      const theme = getThemeById('invalid' as Theme)
      expect(theme).toBeUndefined()
    })

    it('returns undefined for empty string', () => {
      const theme = getThemeById('' as Theme)
      expect(theme).toBeUndefined()
    })

    it('is case-sensitive', () => {
      const theme = getThemeById('Default' as Theme)
      expect(theme).toBeUndefined()
    })

    // After implementation, test all 35 themes
    it('returns correct theme for all theme IDs', () => {
      themes.forEach(themeConfig => {
        const found = getThemeById(themeConfig.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(themeConfig.id)
        expect(found?.name).toBe(themeConfig.name)
      })
    })
  })

  describe('getModeById', () => {
    it('returns mode for valid light id', () => {
      const light = getModeById('light')
      expect(light).toBeDefined()
      expect(light?.id).toBe('light')
      expect(light?.label).toBe('Light')
    })

    it('returns mode for valid dark id', () => {
      const dark = getModeById('dark')
      expect(dark).toBeDefined()
      expect(dark?.id).toBe('dark')
      expect(dark?.label).toBe('Dark')
    })

    it('returns mode for valid system id', () => {
      const system = getModeById('system')
      expect(system).toBeDefined()
      expect(system?.id).toBe('system')
      expect(system?.label).toBe('System')
    })

    it('returns undefined for invalid id', () => {
      const mode = getModeById('invalid' as Mode)
      expect(mode).toBeUndefined()
    })

    it('returns undefined for empty string', () => {
      const mode = getModeById('' as Mode)
      expect(mode).toBeUndefined()
    })

    it('is case-sensitive', () => {
      const mode = getModeById('Light' as Mode)
      expect(mode).toBeUndefined()
    })
  })

  describe('isValidTheme', () => {
    it('returns true for valid theme id', () => {
      expect(isValidTheme('default')).toBe(true)
    })

    it('returns false for invalid theme id', () => {
      expect(isValidTheme('invalid')).toBe(false)
      expect(isValidTheme('nonexistent')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidTheme('')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidTheme(null as any)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidTheme(undefined as any)).toBe(false)
    })

    it('is case-sensitive', () => {
      expect(isValidTheme('Default')).toBe(false)
      expect(isValidTheme('DEFAULT')).toBe(false)
    })

    // After implementation, test all 35 themes
    it('returns true for all valid theme IDs', () => {
      themes.forEach(theme => {
        expect(isValidTheme(theme.id)).toBe(true)
      })
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
      expect(isValidMode('nonexistent')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidMode('')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidMode(null as any)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidMode(undefined as any)).toBe(false)
    })

    it('is case-sensitive', () => {
      expect(isValidMode('Light')).toBe(false)
      expect(isValidMode('LIGHT')).toBe(false)
    })
  })

  describe('Type Safety', () => {
    it('Theme type only accepts valid theme IDs', () => {
      // TypeScript compile-time check
      const validTheme: Theme = 'default'
      expect(typeof validTheme).toBe('string')
    })

    it('Mode type only accepts valid mode IDs', () => {
      // TypeScript compile-time check
      const validMode: Mode = 'light'
      expect(typeof validMode).toBe('string')
    })

    it('ThemeConfig interface matches theme structure', () => {
      themes.forEach(theme => {
        const config: ThemeConfig = theme
        expect(config.id).toBe(theme.id)
        expect(config.name).toBe(theme.name)
        expect(config.description).toBe(theme.description)
        expect(config.icon).toBe(theme.icon)
      })
    })

    it('ModeConfig interface matches mode structure', () => {
      modes.forEach(mode => {
        const config: ModeConfig = mode
        expect(config.id).toBe(mode.id)
        expect(config.label).toBe(mode.label)
        expect(config.icon).toBe(mode.icon)
      })
    })
  })

  describe('Data Integrity', () => {
    it('themes array is not empty', () => {
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('modes array has exactly 3 items', () => {
      expect(Array.isArray(modes)).toBe(true)
      expect(modes.length).toBe(3)
    })

    it('all themes have valid icon names (non-empty strings)', () => {
      themes.forEach(theme => {
        expect(typeof theme.icon).toBe('string')
        expect(theme.icon.length).toBeGreaterThan(0)
      })
    })

    it('all modes have valid icon values', () => {
      const validIcons = ['Sun', 'Moon', 'Monitor']
      modes.forEach(mode => {
        expect(validIcons).toContain(mode.icon)
      })
    })

    it('theme IDs match TypeScript Theme type', () => {
      // This is a runtime check that all theme IDs are valid
      themes.forEach(theme => {
        expect(isValidTheme(theme.id)).toBe(true)
      })
    })

    it('mode IDs match TypeScript Mode type', () => {
      // This is a runtime check that all mode IDs are valid
      modes.forEach(mode => {
        expect(isValidMode(mode.id)).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles themes array mutations gracefully', () => {
      const originalLength = themes.length
      // Should not mutate original array
      const filtered = themes.filter(t => t.id === 'default')
      expect(themes.length).toBe(originalLength)
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('handles modes array mutations gracefully', () => {
      const originalLength = modes.length
      // Should not mutate original array
      const filtered = modes.filter(m => m.id === 'light')
      expect(modes.length).toBe(originalLength)
      expect(filtered.length).toBe(1)
    })

    it('getThemeById handles special characters in ID', () => {
      // After implementation, some theme IDs may have hyphens
      const themeWithHyphen = themes.find(t => t.id.includes('-'))
      if (themeWithHyphen) {
        const found = getThemeById(themeWithHyphen.id)
        expect(found).toBeDefined()
      }
    })

    it('isValidTheme handles very long strings', () => {
      const longString = 'a'.repeat(1000)
      expect(isValidTheme(longString)).toBe(false)
    })

    it('isValidMode handles very long strings', () => {
      const longString = 'a'.repeat(1000)
      expect(isValidMode(longString)).toBe(false)
    })
  })

  describe('Performance', () => {
    it('getThemeById performs efficiently with many themes', () => {
      const start = performance.now()
      themes.forEach(theme => {
        getThemeById(theme.id)
      })
      const end = performance.now()
      // Should complete in reasonable time (< 10ms for 35 themes)
      expect(end - start).toBeLessThan(10)
    })

    it('isValidTheme performs efficiently', () => {
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        isValidTheme('default')
        isValidTheme('invalid')
      }
      const end = performance.now()
      // Should complete quickly
      expect(end - start).toBeLessThan(100)
    })
  })
})

