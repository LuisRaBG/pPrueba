// src/layouts/Sidebar.js
import React, { useCallback } from 'react';
import {
    Drawer as MuiDrawer, List, ListItemButton, ListItemIcon, ListItemText,
    Divider, Box, Typography, useTheme, alpha, Avatar,
    ListSubheader,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Folder as FolderIcon,
    CalendarMonth as CalendarIcon, // Icono actualizado
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Groups as GroupsIcon,
    MailOutline as MailOutlineIcon,
} from '@mui/icons-material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useProject } from '../contexts/ProjectContext.js';
import { renderAvatarContent, getInitials as getMemberInitials } from '../utils/avatarUtils.js'; // Ajusta la ruta si es necesario

// --- Constantes ---
const MOBILE_DRAWER_WIDTH = 280;

// --- Componente Miembro (Texto blanco sobre fondo oscuro) ---
const SidebarMiembroItem = ({ miembro }) => {
    const theme = useTheme();
    const textColor = theme.palette.common.white; // Texto siempre blanco

    return (
        <ListItemButton dense sx={{ pl: 2.5, py: 1, mx: 1.5, mb: 0.5, borderRadius: 1.5, transition: theme.transitions.create(['background-color']), '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.08) } }}>
            <ListItemIcon sx={{ minWidth: 32, mr: 1.5 }}>
                <Avatar
                    alt={miembro.nombre || '?'}
                    src={!miembro.icon_name ? (miembro.avatar_url || undefined) : undefined}
                    sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: alpha(textColor, 0.15), color: textColor }}
                >
                    {renderAvatarContent(miembro, { fontSize: '1rem' }) || getMemberInitials(miembro.nombre)}
                </Avatar>
            </ListItemIcon>
            <ListItemText
                primary={miembro.nombre || miembro.email || 'Miembro desconocido'}
                secondary={miembro.rol}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true, color: textColor }}
                secondaryTypographyProps={{ variant: 'caption', noWrap: true, fontSize: '0.75rem', color: alpha(textColor, 0.7) }}
            />
        </ListItemButton>
    );
};
// --- Fin Componente Miembro ---

// --- Componente NavItem (Selección amarilla sobre fondo oscuro) ---
const NavItem = ({ item, isSubItem = false, onClose, handleNavigationAndClearProject }) => {
    const theme = useTheme();
    const textColor = theme.palette.common.white; // Texto siempre blanco
    const selectedColor = theme.palette.secondary.main; // Amarillo para selección

    const handleClick = () => {
        // Si el item requiere limpiar el proyecto, usa el handler especial
        if (item.clearProject && handleNavigationAndClearProject) {
            handleNavigationAndClearProject(item.path);
        }
        // Si no, solo navega (NavLink lo hace) y cierra el sidebar si es necesario
        else if (onClose) {
            onClose();
        }
    };

    return (
        <ListItemButton
            component={NavLink}
            to={item.path}
            // `end` es importante para que '/' o '/dashboard' no coincidan con otras rutas
            end={item.path === '/dashboard' || item.path === '/'}
            onClick={handleClick}
            sx={{
                justifyContent: 'flex-start',
                px: 2.5, py: 1.3, mb: 1, borderRadius: 1.5, mx: 1.5,
                color: alpha(textColor, 0.8), // Blanco semi-transparente por defecto
                transition: theme.transitions.create(['background-color', 'color', 'padding-left']),
                '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.08), // Fondo blanco muy sutil al pasar el ratón
                    color: textColor // Texto blanco opaco al pasar el ratón
                },
                '&.Mui-selected': {
                    backgroundColor: alpha(selectedColor, 0.15), // Fondo amarillo semi-transparente
                    color: selectedColor, // Texto e icono amarillos
                    fontWeight: 600,
                    '& .MuiListItemIcon-root': { color: selectedColor },
                    '&:hover': {
                        backgroundColor: alpha(selectedColor, 0.25) // Fondo amarillo un poco más opaco al pasar el ratón
                    }
                },
                ...(isSubItem && { pl: 4 }), // Indentación para sub-items si los hubiera
            }}
        >
            <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit', transition: theme.transitions.create('color') }}>
                {/* Clona el icono para poder pasarle estilos */}
                {React.cloneElement(item.icon, { sx: { fontSize: '1.4rem', color: 'inherit' } })}
            </ListItemIcon>
            <ListItemText
                primary={item.text}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 'inherit', whiteSpace: 'nowrap', color: 'inherit' }}
            />
        </ListItemButton>
    );
};
// --- Fin NavItem ---


// --- Componente Sidebar Principal ---
const Sidebar = ({
    open,
    onClose,
    onOpenAcceptInviteDialog
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const {
        currentProjectId,
        currentProjectMembers,
        loadingMembers,
        errorMembers,
        openTeamPanel,
        setActiveProject
    } = useProject();

    const textColor = theme.palette.common.white; // Texto siempre blanco

    // --- Handlers ---
    const handleLogout = useCallback(async () => {
        await logout();
        onClose();
    }, [logout, onClose]);

    // Handler para navegar a rutas generales (limpiando el proyecto activo)
    const handleNavigationAndClearProject = useCallback((path) => {
        setActiveProject(null); // Limpia el proyecto activo en el contexto
        navigate(path);         // Navega a la ruta general
        if (onClose) {
            onClose();          // Cierra el sidebar (si está abierto)
        }
    }, [setActiveProject, navigate, onClose]);

    // --- Items del Menú ---
    const menuItems = [
        // *** CORREGIDO: Ruta '/dashboard' para "Ver Proyectos" ***
        { text: 'Dashboard', icon: <FolderIcon />, path: '/dashboard', clearProject: true },
        // *** CORREGIDO: Ruta '/calendar' para "Calendario" ***
        { text: 'Calendario', icon: <CalendarIcon />, path: '/calendar', clearProject: true },
        // { text: 'Ver Proyectos', icon: <FolderIcon />, path: '/projects', clearProject: true }, // Eliminado o corregido arriba
    ];

    // --- Contenido del Drawer ---
    const drawerContent = (
        <>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', px: 2, height: '64px', mb: 2, bgcolor: 'transparent' }}>
                <Box component={NavLink} to="/" onClick={() => handleNavigationAndClearProject('/')} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <Box component="img" src="/logo ito.png" alt="Logo" sx={{ height: 38, width: 'auto', mr: 1.5 }} />
                    <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: '1.1rem', color: textColor, letterSpacing: '0.5px' }}>
                        Control Proyectos
                    </Typography>
                </Box>
            </Box>

            {/* Información del Usuario */}
            <Box sx={{ textAlign: 'left', px: 2.5, mb: 3, mt: 1, color: textColor }}>
                 <Avatar
                     alt={user?.user_metadata?.nombre || '?'}
                     src={!user?.user_metadata?.icon_name ? (user?.user_metadata?.avatar_url || undefined) : undefined}
                     sx={{ width: 48, height: 48, mb: 1.5, bgcolor: alpha(textColor, 0.15), color: textColor, fontSize: '1rem', fontWeight: 600, border: `2px solid ${alpha(textColor, 0.3)}` }}
                 >
                    {renderAvatarContent(user, { fontSize: '1.8rem' })}
                 </Avatar>
                <Box>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, color: 'inherit', lineHeight: 1.3 }}>
                        {user?.user_metadata?.nombre || user?.email || 'Usuario'}
                    </Typography>
                    <Typography variant="caption" color={alpha(textColor, 0.75)} noWrap sx={{ display: 'block' }}>
                        {user?.email || ''}
                    </Typography>
                </Box>
            </Box>

            {/* Lista Principal de Navegación */}
            <List sx={{ flexGrow: 1, px: 0, overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(textColor, 0.3), borderRadius: '3px', '&:hover': { backgroundColor: alpha(textColor, 0.5) } } }}>
                {menuItems.map((item) => (
                    <NavItem
                        key={item.text}
                        item={item}
                        onClose={onClose}
                        handleNavigationAndClearProject={handleNavigationAndClearProject}
                    />
                ))}

                {/* Botón Unirse a Proyecto */}
                <ListItemButton onClick={onOpenAcceptInviteDialog} sx={{ px: 2.5, py: 1.3, mb: 1, borderRadius: 1.5, mx: 1.5, color: alpha(textColor, 0.8), '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.08), color: textColor } }}>
                    <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
                        <MailOutlineIcon sx={{ fontSize: '1.4rem', color: 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Unirse a Proyecto" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} sx={{ color: 'inherit' }} />
                </ListItemButton>

                {/* Sección Equipo */}
                {currentProjectId && (
                    <>
                        <Divider variant="middle" sx={{ my: 2, mx: 1.5, borderColor: alpha(textColor, 0.2) }} />
                        <List subheader={ <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: '24px', mx: 2.5, mb: 1.5, fontSize: '0.8rem', fontWeight: 600, color: alpha(textColor, 0.65), textTransform: 'uppercase', letterSpacing: '0.5px' }}> Equipo del Proyecto </ListSubheader> } sx={{ maxHeight: '25vh', overflowY: 'auto', pb: 1, '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(textColor, 0.25), borderRadius: '3px' } }}>
                            {loadingMembers && ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}><CircularProgress size={24} color="inherit" sx={{ color: textColor }} /></Box> )}
                            {errorMembers && !loadingMembers && ( <Alert severity="warning" variant="outlined" sx={{ mx: 1.5, fontSize: '0.8rem', p: '4px 10px', color: textColor, borderColor: alpha(textColor, 0.5) }}> {errorMembers} </Alert> )}
                            {!loadingMembers && !errorMembers && currentProjectMembers.length === 0 && ( <Typography variant="caption" color={alpha(textColor, 0.7)} sx={{ display: 'block', textAlign: 'center', px: 2, py: 1, fontStyle: 'italic' }}> No hay miembros asignados. </Typography> )}
                            {!loadingMembers && !errorMembers && currentProjectMembers.map((miembro) => ( <SidebarMiembroItem key={miembro.id_usuario} miembro={miembro} /> ))}
                        </List>
                        {/* Botón Gestionar Equipo */}
                        {openTeamPanel && ( // Asegura que la función exista antes de renderizar
                            <Box sx={{ px: 1.5, mt: 1.5, mb: 1 }}>
                                 <Button
                                     onClick={() => { openTeamPanel(); onClose(); }} // Llama a la función del contexto
                                     size="medium"
                                     fullWidth
                                     variant="contained"
                                     color="secondary"
                                     startIcon={<GroupsIcon />}
                                     disabled={!currentProjectId || loadingMembers}
                                     sx={{ fontSize: '0.85rem', py: 1, color: theme.palette.secondary.contrastText, }}
                                 >
                                    Gestionar Equipo
                                 </Button>
                            </Box>
                        )}
                    </>
                )}
            </List>

            {/* Sección Inferior Fija */}
            <Box sx={{ mt: 'auto', mb: 2, flexShrink: 0 }}>
                 <Divider variant="middle" sx={{ my: 1.5, mx: 1.5, borderColor: alpha(textColor, 0.2) }}/>
                 <List sx={{ px: 0 }}>
                     {/* Item Configuración */}
                     <NavItem item={{ text: 'Configuración', icon: <SettingsIcon />, path: '/settings', clearProject: true }} onClose={onClose} handleNavigationAndClearProject={handleNavigationAndClearProject} />
                     {/* Botón Cerrar Sesión */}
                     <ListItemButton onClick={handleLogout} sx={{ px: 2.5, py: 1.3, mb: 0.5, borderRadius: 1.5, mx: 1.5, color: theme.palette.error.light, transition: theme.transitions.create(['background-color', 'color']), '&:hover': { backgroundColor: alpha(theme.palette.error.dark, 0.25), color: theme.palette.error.light } }}>
                         <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
                             <LogoutIcon sx={{ fontSize: '1.4rem', color: 'inherit' }} />
                         </ListItemIcon>
                         <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} sx={{ color: 'inherit' }} />
                     </ListItemButton>
                 </List>
            </Box>
        </>
    );

    // --- MuiDrawer ---
    const backgroundColor = theme.palette.primary.main; // Azul primario opaco

    return (
        <MuiDrawer
            variant="temporary" // Siempre temporal en móvil
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }} // Mejora rendimiento en móvil
            PaperProps={{
                sx: {
                    width: MOBILE_DRAWER_WIDTH,
                    display: 'flex', flexDirection: 'column', height: '100vh',
                    overflow: 'hidden', backgroundColor: backgroundColor,
                    borderRight: 'none', boxShadow: theme.shadows[3]
                }
            }}
        >
            {drawerContent}
        </MuiDrawer>
    );
};

export default Sidebar;
