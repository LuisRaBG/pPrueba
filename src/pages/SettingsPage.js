// src/pages/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Stack,
    Avatar,
    Tooltip,
    alpha,
    useTheme,
    Grid,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton as MuiIconButton // Renombrado para claridad
} from '@mui/material';

// Iconos de MUI para UI
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'; // Importación directa
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'; // Importación directa
import LockResetIcon from '@mui/icons-material/LockReset'; // Importación directa
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Importación directa
import PaletteIcon from '@mui/icons-material/Palette'; // Para botón de elegir icono
import CloseIcon from '@mui/icons-material/Close';

// --- Iconos Predefinidos de react-icons/fc ---
import {
    FcBusinessman, FcBusinesswoman, FcLinux, FcAndroidOs, FcMultipleDevices,
    FcBearish, FcBullish, FcLike, FcGlobe, FcLandscape, FcNightLandscape,
    FcSportsMode, /* FcVideoGame, <-- ELIMINADO */ FcVlc, FcMindMap, FcBiotech
    // Puedes añadir más iconos válidos de la lista del error si quieres
} from "react-icons/fc";
// --- Fin Iconos Predefinidos ---

import { supabase } from '../utils/supabase.js'; // Ajusta la ruta si es necesario
import { useAuth } from '../contexts/AuthContext.js';
import { updateUserMetadata } from '../services/userService.js'; // Ajusta la ruta si es necesario

// --- Configuración de Iconos ---
const predefinedIcons = {
    businessman: FcBusinessman,
    businesswoman: FcBusinesswoman,
    linux: FcLinux,
    android: FcAndroidOs,
    devices: FcMultipleDevices,
    bear: FcBearish,
    bull: FcBullish,
    like: FcLike,
    globe: FcGlobe,
    landscape: FcLandscape,
    night: FcNightLandscape,
    sports: FcSportsMode, // Usamos FcSportsMode como sustituto
    // game: FcVideoGame, <-- ELIMINADO
    vlc: FcVlc,
    mindmap: FcMindMap,
    biotech: FcBiotech,
};
const defaultIconName = 'businessman'; // Icono por defecto

const getIconComponent = (iconName) => {
    return predefinedIcons[iconName] || predefinedIcons[defaultIconName];
};
// --- Fin Configuración de Iconos ---

// Componente SectionPaper
const SectionPaper = (props) => ( <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }} {...props} /> );

// Función maskEmail
const maskEmail = (email) => {
    if (!email || !email.includes('@')) { return 'Correo no disponible'; }
    const [localPart, domain] = email.split('@');
    return `***********@${domain}`;
};

const SettingsPage = () => {
    const theme = useTheme();
    const { user, isLoading: authLoading, authError, refreshUser } = useAuth();

    // Estados de Perfil
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [selectedIconName, setSelectedIconName] = useState(defaultIconName);
    const [initialIconName, setInitialIconName] = useState(defaultIconName);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState(null);
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(null);

    // Estados de Contraseña
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState(null);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(null);

    // Estado del Dialog
    const [iconDialogOpen, setIconDialogOpen] = useState(false);

    // Carga inicial
    useEffect(() => {
        if (user) {
            const currentIcon = user.user_metadata?.icon_name || defaultIconName;
            setNombre(user.user_metadata?.nombre || '');
            setEmail(user.email || '');
            setSelectedIconName(currentIcon);
            setInitialIconName(currentIcon);
        }
    }, [user]);

    // Limpia mensajes de perfil
    useEffect(() => {
        setProfileSaveError(null);
        setProfileSaveSuccess(null);
    }, [nombre, selectedIconName]);

    // Limpia mensajes de contraseña
    useEffect(() => {
        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);
    }, [newPassword, confirmPassword]);

    // Guardar Perfil (Nombre/Icono)
    const handleProfileSave = useCallback(async (event) => {
        event.preventDefault();
        setProfileSaveError(null);
        setProfileSaveSuccess(null);
        if (!nombre.trim()) { setProfileSaveError('El nombre no puede estar vacío.'); return; }
        if (!user?.id) { setProfileSaveError('No se pudo identificar al usuario.'); return; }

        const nameChanged = nombre.trim() !== (user?.user_metadata?.nombre || '');
        const iconChanged = selectedIconName !== initialIconName;
        if (!nameChanged && !iconChanged) {
            setProfileSaveError('No hay cambios para guardar.');
            return;
        }

        setIsSavingProfile(true);
        try {
            const metadataUpdates = {
                nombre: nombre.trim(),
                icon_name: selectedIconName,
            };
            await updateUserMetadata(metadataUpdates);
            setProfileSaveSuccess('Perfil actualizado correctamente.');
            setInitialIconName(selectedIconName);
            if (typeof refreshUser === 'function') { await refreshUser(); }
            setTimeout(() => setProfileSaveSuccess(null), 4000);
        } catch (err) {
            console.error("Error guardando perfil:", err);
            setProfileSaveError(err.message || 'No se pudo actualizar el perfil.');
        } finally {
            setIsSavingProfile(false);
        }
    }, [nombre, selectedIconName, user, refreshUser, initialIconName]);

    // Cambiar Contraseña
    const handlePasswordChange = useCallback(async (event) => {
        event.preventDefault();
        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);

        if (!newPassword || !confirmPassword) {
            setPasswordChangeError('Debes ingresar la nueva contraseña y confirmarla.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordChangeError('Las nuevas contraseñas no coinciden.');
            return;
        }
        if (newPassword.length < 6) {
             setPasswordChangeError('La contraseña debe tener al menos 6 caracteres.');
             return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error("Supabase error updating password:", error);
                if (error.message.includes("same as the old password")) {
                     throw new Error("La nueva contraseña no puede ser igual a la anterior.");
                }
                 if (error.message.includes("Password should be at least 6 characters")) {
                     throw new Error("La contraseña debe tener al menos 6 caracteres.");
                 }
                throw new Error(error.message || 'Error al cambiar la contraseña.');
            }

            setPasswordChangeSuccess('Contraseña actualizada correctamente.');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordChangeSuccess(null), 4000);

        } catch (err) {
            console.error("Error cambiando contraseña:", err);
            setPasswordChangeError(err.message || 'No se pudo cambiar la contraseña.');
        } finally {
            setIsChangingPassword(false);
        }
    }, [newPassword, confirmPassword]);

    // Handlers Dialog Iconos
    const handleOpenIconDialog = () => setIconDialogOpen(true);
    const handleCloseIconDialog = () => setIconDialogOpen(false);
    const handleIconSelect = (iconName) => {
        setSelectedIconName(iconName);
        handleCloseIconDialog();
    };

    // --- Renderizado ---
    if (authLoading) {
        return (
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }
    if (authError && !user) {
        return (
            <Container maxWidth="sm" sx={{ py: 5 }}>
                <Alert severity="error">Error al cargar la información del usuario: {authError}</Alert>
            </Container>
        );
    }
    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 5 }}>
                <Alert severity="warning">Debes iniciar sesión para acceder a la configuración.</Alert>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button variant="contained" onClick={() => window.location.href = '/login'}>
                        Iniciar Sesión
                    </Button>
                </Box>
            </Container>
        );
    }

    const displayEmail = maskEmail(email);
    const SelectedIconComponent = getIconComponent(selectedIconName);
    const profileHasChanged = nombre.trim() !== (user?.user_metadata?.nombre || '') || selectedIconName !== initialIconName;

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
            {/* Encabezado */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                <SettingsIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                    Configuración
                </Typography>
            </Stack>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Stack spacing={4}>

                        {/* --- Sección Perfil --- */}
                        <Box component="form" onSubmit={handleProfileSave} noValidate>
                            <SectionPaper>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                                    Perfil Público
                                </Typography>
                                <Stack spacing={3}>
                                    {/* Avatar con Icono */}
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                                        <Avatar
                                            alt={nombre || '?'}
                                            sx={{
                                                width: 100, height: 100,
                                                bgcolor: alpha(theme.palette.primary.light, 0.2),
                                            }}
                                        >
                                            <SelectedIconComponent style={{ fontSize: '3.5rem' }} />
                                        </Avatar>
                                        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<PaletteIcon />}
                                                disabled={isSavingProfile}
                                                onClick={handleOpenIconDialog}
                                                sx={{ mb: 1 }}
                                            >
                                                Elegir Icono
                                            </Button>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                Selecciona un icono para tu perfil.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    {/* Nombre */}
                                    <TextField required fullWidth id="nombre" label="Nombre Completo" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isSavingProfile} variant="outlined" InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon color="action" /></InputAdornment>), }} />
                                    {/* Mensajes y Botón Guardar Perfil */}
                                    <Stack spacing={2} alignItems="flex-end">
                                        {profileSaveError && ( <Alert severity="error" sx={{ width: '100%' }} onClose={() => setProfileSaveError(null)}>{profileSaveError}</Alert> )}
                                        {profileSaveSuccess && ( <Alert severity="success" sx={{ width: '100%' }} onClose={() => setProfileSaveSuccess(null)}>{profileSaveSuccess}</Alert> )}
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={isSavingProfile || !profileHasChanged}
                                            startIcon={isSavingProfile ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                            size="large"
                                            sx={{ px: 3, py: 1.2 }}
                                        >
                                            {isSavingProfile ? 'Guardando...' : 'Guardar Perfil'}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </SectionPaper>
                        </Box>

                        {/* --- Sección Seguridad --- */}
                        <Box component="form" onSubmit={handlePasswordChange} noValidate>
                            <SectionPaper>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                                    Seguridad
                                </Typography>
                                <Stack spacing={3}>
                                    {/* Email */}
                                    <TextField
                                        fullWidth
                                        id="email-display"
                                        label="Correo Electrónico"
                                        value={displayEmail}
                                        disabled
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><EmailOutlinedIcon color="action" /></InputAdornment>),
                                            endAdornment: (<InputAdornment position="end"><Tooltip title="Correo protegido"><VisibilityOffIcon color="action" sx={{ fontSize: '1.2rem' }}/></Tooltip></InputAdornment>)
                                        }}
                                        sx={{
                                            '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: theme.palette.text.primary, cursor: 'default', },
                                            '& .MuiOutlinedInput-root.Mui-disabled': { backgroundColor: alpha(theme.palette.action.selected, 0.05), },
                                        }}
                                        helperText="El correo electrónico no se puede cambiar."
                                    />
                                    {/* Nueva Contraseña */}
                                    <TextField
                                        required
                                        fullWidth
                                        type="password"
                                        id="newPassword"
                                        label="Nueva Contraseña"
                                        name="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isChangingPassword}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment>),
                                        }}
                                        helperText="Mínimo 6 caracteres."
                                    />
                                    {/* Confirmar Nueva Contraseña */}
                                    <TextField
                                        required
                                        fullWidth
                                        type="password"
                                        id="confirmPassword"
                                        label="Confirmar Nueva Contraseña"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isChangingPassword}
                                        variant="outlined"
                                        error={!!passwordChangeError && passwordChangeError.includes('no coinciden')}
                                        InputProps={{
                                            startAdornment: (<InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment>),
                                        }}
                                    />
                                    {/* Mensajes y Botón Cambiar Contraseña */}
                                    <Stack spacing={2} alignItems="flex-end">
                                        {passwordChangeError && ( <Alert severity="error" sx={{ width: '100%' }} onClose={() => setPasswordChangeError(null)}>{passwordChangeError}</Alert> )}
                                        {passwordChangeSuccess && ( <Alert severity="success" sx={{ width: '100%' }} onClose={() => setPasswordChangeSuccess(null)}>{passwordChangeSuccess}</Alert> )}
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="secondary"
                                            disabled={isChangingPassword || !newPassword || !confirmPassword}
                                            startIcon={isChangingPassword ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                                            size="large"
                                            sx={{ px: 3, py: 1.2 }}
                                        >
                                            {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </SectionPaper>
                        </Box>

                    </Stack>
                </Grid>

                {/* Columna Derecha (Ayuda) */}
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.04), height: '100%' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Ayuda</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Actualiza tu nombre y elige un icono que te represente.
                            <br /><br />
                            Para cambiar tu contraseña, ingresa la nueva y confírmala.
                            <br /><br />
                            El correo electrónico no se puede modificar.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* --- DIALOG PARA SELECCIONAR ICONO --- */}
            <Dialog onClose={handleCloseIconDialog} open={iconDialogOpen} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Elige un Icono
                    <MuiIconButton aria-label="close" onClick={handleCloseIconDialog} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <CloseIcon />
                    </MuiIconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
                    <Grid container spacing={{ xs: 1, sm: 2 }} justifyContent="center">
                        {Object.entries(predefinedIcons).map(([name, IconComponent]) => (
                            <Grid item key={name} xs={4} sm={3} md={2} sx={{ textAlign: 'center' }}>
                                <Tooltip title={name.charAt(0).toUpperCase() + name.slice(1)}>
                                    <MuiIconButton
                                        onClick={() => handleIconSelect(name)}
                                        size="large"
                                        sx={{
                                            border: `2px solid transparent`,
                                            borderRadius: '50%',
                                            padding: theme.spacing(1.5),
                                            transition: theme.transitions.create(['border-color', 'background-color']),
                                            bgcolor: 'action.hover',
                                            ...(name === selectedIconName && {
                                                borderColor: theme.palette.primary.main,
                                                bgcolor: alpha(theme.palette.primary.light, 0.2),
                                            }),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.action.hover, 0.2),
                                                borderColor: name === selectedIconName ? theme.palette.primary.dark : theme.palette.divider,
                                            }
                                        }}
                                    >
                                        <IconComponent style={{ fontSize: '2.5rem' }} />
                                    </MuiIconButton>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
            </Dialog>

        </Container>
    );
};

export default SettingsPage;
