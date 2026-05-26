// Re-export from the shared ThemeContext so all components get the same reactive state.
// This fixes the bug where each component's useTheme() had isolated local state
// that did not update when another component toggled the theme.
export { useTheme } from '@/contexts/ThemeContext';
