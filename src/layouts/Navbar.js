// src/layouts/Navbar.js
import React, { useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    useTheme,
    Menu,
    MenuItem,
    Divider,
    Badge,
    alpha,
    Avatar,
    Stack,
    Tooltip,
    styled,
    Button,
    List,
    ListItemText
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    AccountCircle as AccountCircleIcon,
    NotificationsNone
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.js';
import { useNotifications } from '../contexts/NotificationContext.js';
import { useProject } from '../contexts/ProjectContext.js';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
// *** AÑADIDO: Importa las utilidades de avatar ***
import { renderAvatarContent } from '../utils/avatarUtils.js'; // Ajusta la ruta si es necesario


// --- Styled Components ---
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    height: '56px', // Equivalent to h-14
    // Mimic backdrop blur effect
    backgroundColor: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: 'blur(8px)',
    color: theme.palette.text.primary,
    boxShadow: 'none', // Remove default shadow
    borderBottom: `1px solid ${theme.palette.divider}`, // Add bottom border
    zIndex: theme.zIndex.drawer + 1,
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    minHeight: '56px !important', // Match AppBar height
    justifyContent: 'space-between',
    padding: theme.spacing(0, { xs: 1, md: 2 }), // Adjust padding
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        minWidth: '16px',
        height: '16px',
        fontSize: '0.6rem',
        fontWeight: '600',
        borderRadius: '5px',
        padding: '0 3px',
        right: 3,
        top: 3,
    },
}));


// --- Componente Navbar ---
const Navbar = ({ handleDrawerToggle, title = "Control Proyectos" }) => { // Added title prop
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { setActiveProject } = useProject();

    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

    // --- Handlers Menú Usuario ---
    const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
    const handleMenuClose = useCallback(() => setAnchorEl(null), []);

    const handleLogout = useCallback(async () => {
        handleMenuClose();
        await logout();
    }, [logout, handleMenuClose]);

    const handleNavigate = useCallback((path) => {
        handleMenuClose();
        navigate(path);
    }, [navigate, handleMenuClose]);

    // --- Handlers Menú Notificaciones ---
    const handleNotificationMenuOpen = useCallback((event) => {
        setNotificationAnchorEl(event.currentTarget);
    }, []);

    const handleNotificationMenuClose = useCallback(() => {
        setNotificationAnchorEl(null);
    }, []);

    const handleMarkRead = useCallback((notificationId) => {
        markAsRead(notificationId);
    }, [markAsRead]);

    const handleMarkAllRead = useCallback(() => {
        markAllAsRead();
        handleNotificationMenuClose();
    }, [markAllAsRead, handleNotificationMenuClose]);

    // --- Otros Handlers ---
    const handleSearchClick = () => {
        console.log("Abrir búsqueda móvil");
    };

    const handleNavigateAndClearProject = useCallback((path) => {
        setActiveProject(null);
        navigate(path);
    }, [setActiveProject, navigate]);

    return (
        <StyledAppBar position="fixed">
            <StyledToolbar>
                {/* --- Sección Izquierda --- */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Abrir menú" arrow>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            // Hide on medium screens and up
                            sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' }, '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.08) } }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Tooltip>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        component={RouterLink}
                        to="/"
                        onClick={(e) => { e.preventDefault(); handleNavigateAndClearProject('/'); }}
                        sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                        <Box
                            component="img"
                            src="/logo ito.png"
                            alt="Logo InvestigApp"
                            sx={{
                                height: 32,
                                width: 32,
                                borderRadius: '50%', // Make logo round
                            }}
                        />
                        {/* Title - hidden on small screens */}
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{ display: { xs: 'none', sm: 'inline-block' }, fontSize: '1.0rem', fontWeight: 600 }}
                        >
                            {title}
                        </Typography>
                    </Stack>
                </Stack>
                {/* --- Sección Derecha --- */}
                <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}> {/* Adjusted spacing */}
                    {/* Búsqueda */}
                    <Tooltip title="Buscar" arrow>
                        <IconButton color="inherit" onClick={handleSearchClick} sx={{ '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.06) } }}>
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Notificaciones */}
                    <Tooltip title="Notificaciones" arrow>
                        <IconButton
                            color="inherit"
                            onClick={handleNotificationMenuOpen}
                            sx={{ '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.08) } }}
                        >
                            <StyledBadge badgeContent={unreadCount} overlap="circular">
                                <NotificationsIcon />
                            </StyledBadge>
                        </IconButton>
                    </Tooltip>

                    {/* Menú de Usuario (Avatar Actualizado) */}
                    {isAuthenticated && user ? (
                        <Tooltip title="Cuenta" arrow>
                            <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 0.5 }}>
                                <Avatar
                                    alt={user?.user_metadata?.nombre || '?'}
                                    // Si no hay icono, intenta usar avatar_url
                                    src={!user?.user_metadata?.icon_name ? (user?.user_metadata?.avatar_url || undefined) : undefined}
                                    sx={{
                                        width: 32, height: 32, // Adjusted size
                                        border: `1px solid ${theme.palette.divider}`, // Added border
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.dark, // Color for initials
                                        fontWeight: 500,
                                        fontSize: '0.8rem' // Size for initials
                                    }}
                                >
                                    {/* Renderiza icono o iniciales */}
                                    {renderAvatarContent(user, { fontSize: '1.4rem' })}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Button component={RouterLink} to="/login" color="primary" variant="outlined" size="small" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                            Login
                        </Button>
                    )}

                    {/* --- Dropdown Menú Notificaciones --- */}
                    <Menu
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={handleNotificationMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { mt: 1, width: 360, maxHeight: 450, boxShadow: theme.shadows[4], borderRadius: 1.5, display: 'flex', flexDirection: 'column' }, } }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="subtitle1" fontWeight={600}>Notificaciones</Typography>
                            {unreadCount > 0 && ( <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.7rem', fontWeight: 500 }}> Marcar todas leídas </Button> )}
                        </Box>
                        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                            {notifications.length === 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, color: 'text.disabled' }}>
                                    <NotificationsNone sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="body2">No tienes notificaciones nuevas.</Typography>
                                </Box>
                            ) : (
                                notifications.map((notif) => (
                                    <MenuItem
                                        key={notif.id_notificacion}
                                        onClick={() => handleMarkRead(notif.id_notificacion)}
                                        sx={{ display: 'flex', alignItems: 'flex-start', py: 1.5, px: 2, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' }, whiteSpace: 'normal', gap: 1.5 }}
                                    >
                                        <ListItemText
                                            primary={notif.titulo || 'Notificación'}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}> {notif.mensaje} </Typography>
                                                    <Typography variant="caption" color="text.secondary"> {formatDistanceToNow(new Date(notif.fecha_creacion), { addSuffix: true, locale: es })} </Typography>
                                                </>
                                            }
                                            primaryTypographyProps={{ fontWeight: 500, mb: 0.25 }}
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </MenuItem>
                                ))
                            )}
                        </List>
                    </Menu>

                    {/* Dropdown Menú Usuario */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { mt: 1, minWidth: 180, boxShadow: theme.shadows[4], borderRadius: 1.5, }, } }}
                    >
                         <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap> {user?.user_metadata?.nombre || 'Usuario'} </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}> {user?.email || ''} </Typography>
                        </Box>
                        <Divider sx={{ borderStyle: 'dashed' }} />
                        <MenuItem onClick={() => handleNavigate('/profile')} sx={{ py: 1.2, px: 2, fontSize: '0.9rem', '&:hover': { backgroundColor: theme.palette.action.hover} }}>
                            <AccountCircleIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small" /> Mi Perfil
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/settings')} sx={{ py: 1.2, px: 2, fontSize: '0.9rem', '&:hover': { backgroundColor: theme.palette.action.hover} }}>
                            <SettingsIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small" /> Configuración
                        </MenuItem>
                        <Divider sx={{ borderStyle: 'dashed' }} />
                        <MenuItem onClick={handleLogout} sx={{ py: 1.2, px: 2, fontSize: '0.9rem', color: 'error.main', '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) } }}>
                            <LogoutIcon sx={{ mr: 1.5 }} fontSize="small" /> Cerrar Sesión
                        </MenuItem>
                    </Menu>
                </Stack>
            </StyledToolbar>
        </StyledAppBar>
    );
};

export default Navbar;
