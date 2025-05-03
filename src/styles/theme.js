// src/styles/theme.js
import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

// --- CONSTANTES DE DISEÑO ---
const PRIMARY_COLOR = '#1B396A'; // Azul industrial (se mantiene)
const SECONDARY_COLOR = '#FFC107'; // Amarillo más vibrante (ACTUALIZADO)
const ERROR_COLOR = '#D32F2F';
const SUCCESS_COLOR = '#388E3C';
const WARNING_COLOR = '#F57C00';
const INFO_COLOR = '#1976D2';
const GREY_TEXT = '#555E68'; // Gris para texto secundario
const GREY_BORDER = '#DDE1E6'; // Gris claro para bordes
const BACKGROUND_DEFAULT = '#F8F9FA'; // Gris muy claro para fondo general
const BACKGROUND_PAPER = '#FFFFFF'; // Blanco para superficies elevadas
const BASE_BORDER_RADIUS = 3.5; // Bordes ligeramente menos redondeados para móvil (o mantener 12 si se prefiere)

// --- CREACIÓN DEL TEMA ---
export const theme = createTheme({
    // --- PALETA DE COLORES ---
    palette: {
        mode: 'light',
        primary: {
            main: PRIMARY_COLOR,
            light: alpha(PRIMARY_COLOR, 0.8),
            dark: alpha(PRIMARY_COLOR, 0.9),
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: SECONDARY_COLOR, // ACTUALIZADO
            light: alpha(SECONDARY_COLOR, 0.8),
            dark: alpha(SECONDARY_COLOR, 0.9),
            // Considera si el contrastText debe cambiar con el nuevo amarillo
            contrastText: '#000000' // Cambiado a negro para mejor contraste con amarillo vibrante
        },
        error: {
            main: ERROR_COLOR,
            light: alpha(ERROR_COLOR, 0.8),
            dark: alpha(ERROR_COLOR, 0.9),
            contrastText: '#FFFFFF'
        },
        warning: {
            main: WARNING_COLOR,
            light: alpha(WARNING_COLOR, 0.8),
            dark: alpha(WARNING_COLOR, 0.9),
            contrastText: '#FFFFFF'
        },
        success: {
            main: SUCCESS_COLOR,
            light: alpha(SUCCESS_COLOR, 0.8),
            dark: alpha(SUCCESS_COLOR, 0.9),
            contrastText: '#FFFFFF'
        },
        info: {
            main: INFO_COLOR,
            light: alpha(INFO_COLOR, 0.8),
            dark: alpha(INFO_COLOR, 0.9),
            contrastText: '#FFFFFF'
        },
        grey: {
            50: '#F8F9FA', 100: '#F3F5F7', 200: '#EAECEF', 300: '#DDE1E6',
            400: '#C4CDD5', 500: '#919EAB', 600: '#637381', 700: '#454F5B',
            800: '#212B36', 900: '#161C24',
        },
        text: {
            primary: alpha('#000000', 0.87),
            secondary: GREY_TEXT,
            disabled: alpha(GREY_TEXT, 0.5)
        },
        background: {
            default: BACKGROUND_DEFAULT,
            paper: BACKGROUND_PAPER,
        },
        action: {
            active: alpha(GREY_TEXT, 0.54), hover: alpha(GREY_TEXT, 0.05), // Hover más sutil
            selected: alpha(PRIMARY_COLOR, 0.08), disabled: alpha(GREY_TEXT, 0.80),
            disabledBackground: alpha(GREY_TEXT, 0.12), focus: alpha(PRIMARY_COLOR, 0.12),
            hoverOpacity: 0.05, disabledOpacity: 0.48,
        },
        divider: GREY_BORDER,
    },

    // --- TIPOGRAFÍA ---
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.015em' },
        h2: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.3, letterSpacing: '-0.005em' },
        h4: { // ACTUALIZADO
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.25px',
            lineHeight: 1.35 // Mantenido o ajustar si es necesario
        },
        h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
        h6: { fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.4 },
        subtitle1: { fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.5 },
        subtitle2: { fontWeight: 500, fontSize: '0.8rem', color: GREY_TEXT, lineHeight: 1.5 },
        body1: { fontWeight: 400, fontSize: '0.95rem', lineHeight: 1.55 },
        body2: { fontWeight: 400, fontSize: '0.85rem', lineHeight: 1.5 },
        button: { // ACTUALIZADO
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
            letterSpacing: '0.15px', // ACTUALIZADO
        },
        caption: { fontWeight: 400, fontSize: '0.7rem', color: GREY_TEXT, lineHeight: 1.4 },
        overline: { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: GREY_TEXT },
    },

    // --- FORMA (BORDES) ---
    shape: {
        borderRadius: BASE_BORDER_RADIUS,
    },

    // --- SOMBRAS ---
    shadows: [
        "none",
        `0px 1px 2px ${alpha('#555E68', 0.08)}`,
        `0px 2px 5px ${alpha('#555E68', 0.10)}`,
        `0px 3px 8px ${alpha('#555E68', 0.12)}`,
        `0px 4px 12px ${alpha('#555E68', 0.14)}`,
        ...createTheme().shadows.slice(5).map((s) =>
            s.replace(/rgba\(0,0,0,(.*?)\)/g, (match, p1) => `rgba(85, 94, 104, ${parseFloat(p1) * 0.7})`)
        ),
    ],

    // --- SOBREESCRITURAS DE COMPONENTES ---
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: `${alpha(GREY_TEXT, 0.4)} transparent`,
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 6,
                        backgroundColor: alpha(GREY_TEXT, 0.4),
                        minHeight: 18,
                        border: 'none',
                    },
                    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                        backgroundColor: alpha(GREY_TEXT, 0.6),
                    },
                    '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                        backgroundColor: alpha(GREY_TEXT, 0.7),
                    },
                    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: alpha(GREY_TEXT, 0.5),
                    },
                    '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                        backgroundColor: 'transparent',
                    },
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: ({ theme, ownerState }) => ({
                    fontWeight: theme.typography.button.fontWeight,
                    borderRadius: theme.shape.borderRadius * 0.8,
                    padding: ownerState.size === 'large' ? '10px 20px' : ownerState.size === 'small' ? '5px 12px' : '8px 16px',
                    transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'color', 'transform'], {
                        duration: theme.transitions.duration.short,
                    }),
                    '&:active': {
                        transform: 'scale(0.98)',
                    }
                }),
                containedPrimary: ({ theme }) => ({
                    '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}` // ACTUALIZADO
                    },
                }),
                outlined: ({ theme }) => ({
                    borderColor: alpha(theme.palette.divider, 0.9),
                }),
                sizeSmall: {
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                },
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'small',
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: ({ theme }) => ({
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': {
                        fontWeight: 500,
                    },
                }),
                outlined: ({ theme, ownerState }) => ({
                    transform: 'translate(14px, 9px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -9px) scale(0.75)',
                    },
                    ...(ownerState.size === 'medium' && {
                        transform: 'translate(14px, 16px) scale(1)',
                        '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -9px) scale(0.75)',
                        },
                    }),
                }),
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme, ownerState }) => ({
                    borderRadius: theme.shape.borderRadius * 0.8,
                    backgroundColor: theme.palette.background.paper,
                    transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color']),
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.6),
                    },
                    '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '1px',
                        },
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-disabled': {
                        backgroundColor: alpha(theme.palette.action.disabledBackground, 0.9),
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.9),
                        }
                    },
                    '.MuiInputBase-input': {
                        padding: '9px 14px',
                        ...(ownerState.size === 'medium' && {
                            padding: '16.5px 14px',
                        }),
                    },
                }),
                notchedOutline: ({ theme }) => ({
                    borderColor: theme.palette.divider,
                    transition: theme.transitions.create('border-color'),
                }),
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 1,
            },
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    backgroundImage: 'none',
                }),
                outlined: ({ theme }) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: 'transparent',
                    elevation: 0,
                }),
            }
        },
        MuiAlert: {
            styleOverrides: {
                root: ({ theme, ownerState }) => ({
                    borderRadius: theme.shape.borderRadius * 0.8,
                    fontSize: '0.85rem',
                    padding: '4px 12px',
                    ...(ownerState.severity === 'error' && {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                        color: theme.palette.error.dark,
                        '& .MuiAlert-icon': { color: theme.palette.error.main, fontSize: '1.1rem' },
                    }),
                    ...(ownerState.severity === 'success' && {
                        backgroundColor: alpha(theme.palette.success.main, 0.08),
                        color: theme.palette.success.dark,
                        '& .MuiAlert-icon': { color: theme.palette.success.main, fontSize: '1.1rem' },
                    }),
                    ...(ownerState.severity === 'warning' && {
                        backgroundColor: alpha(theme.palette.warning.main, 0.08),
                        color: theme.palette.warning.dark,
                        '& .MuiAlert-icon': { color: theme.palette.warning.main, fontSize: '1.1rem' },
                    }),
                    ...(ownerState.severity === 'info' && {
                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                        color: theme.palette.info.dark,
                        '& .MuiAlert-icon': { color: theme.palette.info.main, fontSize: '1.1rem' },
                    }),
                }),
                outlinedError: ({ theme }) => ({
                    borderColor: alpha(theme.palette.error.main, 0.5),
                    color: theme.palette.error.dark,
                    '& .MuiAlert-icon': { color: theme.palette.error.main },
                }),
                outlinedSuccess: ({ theme }) => ({
                    borderColor: alpha(theme.palette.success.main, 0.5),
                    color: theme.palette.success.dark,
                    '& .MuiAlert-icon': { color: theme.palette.success.main },
                }),
            },
        },
        MuiLink: {
            defaultProps: {
                underline: 'hover',
            },
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.primary.main,
                    fontWeight: theme.typography.fontWeightMedium,
                    textDecorationColor: alpha(theme.palette.primary.main, 0.4),
                    '&:hover': {
                        textDecorationColor: theme.palette.primary.main,
                    },
                }),
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: ({ theme }) => ({
                    fontWeight: theme.typography.fontWeightMedium,
                }),
            },
        },
        MuiAppBar: {
            defaultProps: {
                elevation: 0,
                color: 'inherit',
            },
            styleOverrides: {
                root: ({ theme }) => ({
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }),
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme }) => ({
                    borderRight: 'none',
                    boxShadow: theme.shadows[3],
                }),
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    backgroundColor: alpha(theme.palette.grey[800], 0.95),
                    borderRadius: theme.shape.borderRadius * 0.6,
                    fontSize: '0.7rem',
                    padding: '3px 6px',
                }),
                arrow: ({ theme }) => ({
                    color: alpha(theme.palette.grey[800], 0.95),
                }),
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: theme.shape.borderRadius * 0.8,
                    margin: '4px 10px',
                    padding: '10px 14px',
                    color: theme.palette.text.secondary,
                    '& .MuiListItemIcon-root': {
                        color: 'inherit',
                        minWidth: 'auto',
                        marginRight: theme.spacing(1.5),
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.25rem',
                        }
                    },
                    '& .MuiListItemText-primary': {
                        fontSize: '0.9rem',
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        color: theme.palette.primary.main,
                        fontWeight: theme.typography.fontWeightMedium,
                    },
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                    },
                }),
            },
        },
        MuiListSubheader: {
            styleOverrides: {
                root: ({ theme }) => ({
                    ...theme.typography.overline,
                    lineHeight: 'initial',
                    padding: '6px 14px',
                    marginBottom: theme.spacing(0.5),
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                }),
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 40,
                },
                indicator: ({ theme }) => ({
                    height: 3,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                }),
            }
        },
        MuiTab: {
            styleOverrides: {
                root: ({ theme }) => ({
                    minHeight: 40,
                    minWidth: 'auto',
                    padding: '8px 12px',
                    fontSize: theme.typography.pxToRem(13),
                    textTransform: 'none',
                    fontWeight: theme.typography.fontWeightMedium,
                    '& .MuiTab-iconWrapper': {
                        marginRight: theme.spacing(0.75),
                        fontSize: '1.1rem',
                    }
                }),
            }
        }
    }
});
