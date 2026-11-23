import { createTheme, MantineColorsTuple } from '@mantine/core';

// Paleta principal: Verde Natural / Forest & Emerald Veterinario
const vetGreen: MantineColorsTuple = [
  '#f0fdf4', // 0: Fondo muy claro para alertas y badges
  '#dcfce7', // 1: Fondo suave de hover
  '#bbf7d0', // 2: Bordes y acentos sutiles
  '#86efac', // 3: Acento claro
  '#4ade80', // 4: Verde brillante
  '#22c55e', // 5: Verde vibrante
  '#16a34a', // 6: Verde principal (botones, iconos activos)
  '#15803d', // 7: Verde oscuro (hover principal)
  '#166534', // 8: Verde bosque profundo (sidebar, títulos destacados)
  '#14532d', // 9: Verde bosque oscuro
];

// Paleta secundaria: Salvia / Menta suave para complementos
const sageTeal: MantineColorsTuple = [
  '#f0fdfa',
  '#ccfbf1',
  '#99f6e4',
  '#5eead4',
  '#2dd4bf',
  '#14b8a6',
  '#0d9488',
  '#0f766e',
  '#115e59',
  '#134e4a',
];

// Paleta cálida para estados de advertencia veterinaria (ej: observación clínica)
const amberWarm: MantineColorsTuple = [
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b',
  '#d97706',
  '#b45309',
  '#92400e',
  '#78350f',
];

export const theme = createTheme({
  primaryColor: 'vetGreen',
  primaryShade: 6,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  colors: {
    vetGreen,
    sageTeal,
    amberWarm,
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 0.18s ease-in-out',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
        checkIconPosition: 'right',
      },
      styles: {
        input: {
          backgroundColor: '#f8fafc',
          borderColor: '#cbd5e1',
          cursor: 'pointer',
          fontWeight: 500,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
        shadow: 'xs',
      },
      styles: {
        root: {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        overlayProps: {
          backgroundOpacity: 0.5,
          blur: 4,
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
        size: 'md',
      },
    },
  },
});
