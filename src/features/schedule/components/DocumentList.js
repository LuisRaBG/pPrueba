// src/features/schedule/components/DocumentList.js
import React from 'react';
import {
    List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, IconButton, Tooltip, Stack, alpha, useTheme
} from '@mui/material';
import {
    DescriptionOutlined, PictureAsPdfOutlined, ImageOutlined, InsertDriveFileOutlined,
    FolderZipOutlined, TableChartOutlined, SlideshowOutlined, CodeOutlined,
    DownloadForOfflineOutlined, DeleteOutline,
    VisibilityOutlined,
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns'; // Añadir parseISO
import { es } from 'date-fns/locale';

// Helper getFileIcon (sin cambios)
const getFileIcon = (mimeType) => {
    if (!mimeType) return InsertDriveFileOutlined;
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return PictureAsPdfOutlined;
    if (type.startsWith('image/')) return ImageOutlined;
    if (type.includes('word')) return DescriptionOutlined;
    if (type.includes('spreadsheet') || type.includes('excel')) return TableChartOutlined;
    if (type.includes('presentation') || type.includes('powerpoint')) return SlideshowOutlined;
    if (type.includes('zip') || type.includes('rar')) return FolderZipOutlined;
    if (type.startsWith('text/')) return CodeOutlined;
    return InsertDriveFileOutlined;
};

// Helper formatBytes (sin cambios)
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === null || bytes === undefined || bytes < 0) return '0 Bytes'; // Más robusto
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
};

// Añadir prop onPreview
const DocumentList = ({ documents = [], onDelete, onDownload, onPreview }) => {
    const theme = useTheme();

    if (!documents || documents.length === 0) {
        return ( <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}> No hay documentos para mostrar. </Typography> );
    }

    return (
        <List dense sx={{ width: '100%', p: 0 }}>
            {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.tipo_archivo);
                const formattedSize = formatBytes(doc.tamanio);
                let formattedDate = 'Fecha inválida';
                try {
                    const date = doc.fecha_subida ? parseISO(doc.fecha_subida) : null;
                    if (date && isValid(date)) {
                        formattedDate = format(date, 'dd MMM yyyy, HH:mm', { locale: es });
                    }
                } catch (e) { console.error("Error formatting doc date", e); }

                const uniqueKey = doc.id_documento || `doc-${Math.random()}`;
                const filePath = doc.ruta_archivo; // Usar ruta_archivo
                const fileName = doc.nombre_archivo || 'archivo_desconocido';
                const canInteract = typeof filePath === 'string' && filePath.length > 0;
                // Determinar si se puede previsualizar (simplificado)
                const canPreview = canInteract && doc.tipo_archivo && (
                    doc.tipo_archivo.startsWith('image/') ||
                    doc.tipo_archivo === 'application/pdf' ||
                    doc.tipo_archivo.startsWith('text/') // Permitir texto (experimental)
                );


                return (
                    <ListItem
                        key={uniqueKey}
                        secondaryAction={
                            <Stack direction="row" spacing={0.5}>
                                {/* Botón Vista Previa */}
                                {canPreview && ( // Mostrar solo si se puede previsualizar
                                    <Tooltip title="Vista Previa">
                                        <IconButton
                                            edge="end"
                                            aria-label="vista previa"
                                            onClick={() => typeof onPreview === 'function' && onPreview(doc)} // Pasar el doc completo
                                            size="small"
                                            sx={{ '&:hover': { color: 'info.main' } }}
                                        >
                                            <VisibilityOutlined fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title="Descargar">
                                    <IconButton edge="end" aria-label="descargar" onClick={() => canInteract && typeof onDownload === 'function' && onDownload(filePath, fileName)} size="small" disabled={!canInteract} sx={{ '&:hover': { color: 'primary.main' } }}>
                                        <DownloadForOfflineOutlined fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton edge="end" aria-label="eliminar" onClick={() => canInteract && typeof onDelete === 'function' && onDelete(filePath)} size="small" disabled={!canInteract} sx={{ '&:hover': { color: 'error.main' } }}>
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        }
                        sx={{
                            bgcolor: theme.palette.background.paper,
                            mb: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            boxShadow: theme.shadows[1],
                            transition: theme.transitions.create(['background-color', 'box-shadow']),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.action.hover, 0.04),
                                boxShadow: theme.shadows[2],
                            },
                            // Ajustar padding derecho para acomodar el nuevo botón
                            pr: { xs: 12, sm: 14 },
                            pl: 1.5
                        }}
                        disablePadding={false}
                    >
                        <ListItemAvatar sx={{ minWidth: 36, mr: 1.5 }}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.light, 0.15), width: 32, height: 32 }}>
                                <FileIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', maxWidth: '90%'}} noWrap>
                                    {fileName}
                                </Typography>
                            }
                            secondary={
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {formattedSize} - {formattedDate}
                                </Typography>
                            }
                            sx={{ my: 0.5 }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default DocumentList;