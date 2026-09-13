export const isMacPlatform = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export const modifierKeyLabel = (): string => (isMacPlatform() ? '\u2318' : 'Ctrl');

export const shortcutLabel = (key: string): string => `${modifierKeyLabel()}${key}`;
