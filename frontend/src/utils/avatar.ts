// Avatar por defecto - icono generico de usuario
// Usando un SVG inline como data URL para evitar dependencias externas
export const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmMWY1ZjkiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEwIiByPSIzIiBmaWxsPSIjOTRhM2I4Ii8+PHBhdGggZD0iTTcgMjAuNjYyVjE5YTIgMiAwIDAgMSAyLTJoNmEyIDIgMCAwIDEgMiAydjEuNjYyIiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+'

/**
 * Obtiene la URL del avatar del usuario o el avatar por defecto
 * @param avatar - URL del avatar del usuario (puede ser null/undefined)
 * @returns URL del avatar o el avatar por defecto
 */
export const getAvatarUrl = (avatar?: string | null): string => {
  if (avatar && avatar.trim() !== '') {
    return avatar
  }
  return DEFAULT_AVATAR
}
