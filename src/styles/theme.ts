import { createTheme, MantineColorsTuple } from '@mantine/core';

const enterpriseBlue: MantineColorsTuple = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#4dabf7',
  '#339af0',
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab'
];

const enterpriseTeal: MantineColorsTuple = [
  '#e6fcf5',
  '#c3fae8',
  '#96f2d7',
  '#63e6be',
  '#38d9a9',
  '#20c997',
  '#12b886',
  '#0ca678',
  '#099268',
  '#087f5b'
];

export const theme = createTheme({
  primaryColor: 'enterpriseBlue',
  primaryShade: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  colors: {
    enterpriseBlue,
    enterpriseTeal,
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
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
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
        shadow: 'xs',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
      },
    },
  },
});
