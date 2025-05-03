// src/services/documentService.js
import { supabase } from '../utils/supabase.js'; // Asegúrate de importar tu cliente Supabase configurado
import { v4 as uuidv4 } from 'uuid'; // Necesitarás instalar uuid: npm install uuid

// --- Constantes ---
const BUCKET_NAME = 'documentos';
const DOCUMENTS_TABLE = 'documentos'; // Nombre de tu tabla en la DB

// --- Función genérica para manejar errores de Supabase ---
const handleSupabaseError = (error, contextMessage) => {
    if (error) {
        console.error(`${contextMessage}:`, error);
        throw new Error(error.message || 'Error en la operación con Supabase.');
    }
};

/**
 * Sube un archivo a Supabase Storage y guarda la referencia en la tabla 'documentos'.
 * @param {File} file - El archivo a subir.
 * @param {'proyecto' | 'tarea'} contextType - El tipo de entidad a la que se asocia.
 * @param {string} contextId - El UUID del proyecto o tarea.
 * @returns {Promise<object>} - El registro del documento creado en la base de datos.
 */
const uploadDocument = async (file, contextType, contextId) => {
    if (!file || !contextType || !contextId) {
        throw new Error('Faltan parámetros (archivo, tipo de contexto, ID de contexto) para subir el documento.');
    }
    if (contextType !== 'proyecto' && contextType !== 'tarea') {
        throw new Error('Tipo de contexto inválido. Debe ser "proyecto" o "tarea".');
    }

    // 1. Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    handleSupabaseError(userError, 'Error obteniendo usuario para subida');
    if (!user) throw new Error('Usuario no autenticado.');
    const userId = user.id;

    // 2. Crear ruta única en Storage
    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${contextType}/${contextId}/${uniqueFileName}`;
    console.log(`Subiendo documento a Supabase Storage: bucket=${BUCKET_NAME}, path=${filePath}`);

    // 3. Subir archivo al Storage
    const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });
    handleSupabaseError(storageError, `Error subiendo archivo ${filePath}`);

    // 4. Preparar datos para la tabla 'documentos'
    const documentData = {
        nombre_archivo: file.name,
        ruta_archivo: filePath,
        tipo_archivo: file.type || 'application/octet-stream',
        tamanio: file.size,
        id_usuario_subio: userId,
        id_proyecto: contextType === 'proyecto' ? contextId : null,
        id_tarea: contextType === 'tarea' ? contextId : null,
    };

    // 5. Insertar registro en la tabla 'documentos'
    console.log('Insertando registro en tabla documentos:', documentData);
    const { data: dbData, error: dbError } = await supabase
        .from(DOCUMENTS_TABLE)
        .insert([documentData])
        .select()
        .single();

    // Manejo de error en DB (con intento de rollback en Storage)
    if (dbError) {
        console.error('Error insertando en tabla documentos:', dbError);
        try {
            console.warn(`Intentando eliminar ${filePath} del storage debido a error en DB...`);
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            console.log('Archivo eliminado del storage tras fallo en DB.');
        } catch (removeError) {
            console.error('Error eliminando archivo del storage tras fallo en DB:', removeError);
        }
        handleSupabaseError(dbError, 'Error guardando información del documento en DB');
    }

    console.log('Documento subido y registrado en DB:', dbData);
    return dbData;
};


/**
 * Obtiene los documentos asociados a un proyecto o tarea desde la tabla 'documentos'.
 * @param {'proyecto' | 'tarea' | null} contextType - Tipo de entidad o null para global.
 * @param {string | null} contextId - UUID del proyecto/tarea o null para global.
 * @param {number} [limit=100] - Límite de resultados (para global).
 * @returns {Promise<{documentos: Array<object>}>} - Lista de documentos.
 */
const getDocuments = async (contextType, contextId, limit = 100) => {
    let query = supabase.from(DOCUMENTS_TABLE).select('*');

    if (contextType === 'proyecto' && contextId) {
        query = query.eq('id_proyecto', contextId);
        console.log(`Obteniendo documentos para proyecto ID: ${contextId}`);
    } else if (contextType === 'tarea' && contextId) {
        query = query.eq('id_tarea', contextId);
        console.log(`Obteniendo documentos para tarea ID: ${contextId}`);
    } else if (contextType === null && contextId === null) {
        // Lógica global (ej: últimos subidos por el usuario)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { documentos: [] };
        query = query.eq('id_usuario_subio', user.id).limit(limit);
        console.log(`Obteniendo últimos ${limit} documentos globales para usuario ID: ${user.id}`);
    } else {
        console.warn('getDocuments: Combinación inválida de contextType y contextId', { contextType, contextId });
        return { documentos: [] };
    }

    query = query.order('fecha_subida', { ascending: false });

    try {
        const { data, error } = await query;
        handleSupabaseError(error, 'Error obteniendo documentos de la DB');
        console.log('Documentos obtenidos de DB:', data?.length || 0);
        return { documentos: data || [] };
    } catch (err) {
        console.error("Error en getDocuments (DB):", err);
        throw err;
    }
};

/**
 * Obtiene una URL (pública o firmada) para acceder a un archivo en Supabase Storage.
 * NO inicia la descarga.
 * @param {string} filePath - La ruta relativa del archivo en el bucket.
 * @param {number} expiresIn - Tiempo de validez de la URL firmada en segundos (default 300 = 5 minutos).
 * @returns {Promise<string>} La URL del archivo.
 */
const getDocumentUrl = async (filePath, expiresIn =300) => {
    if(!filePath) throw new Error('Ruta del archivo no proporcionada para obtener URL');

    console.log(`Obteniendo URL para: bucket=${BUCKET_NAME}, path=${filePath}`);

    try{
        const {data:publicUrlData} = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

            let accessUrl = publicUrlData?.publicUrl;

            if (!accessUrl || accessUrl.includes('.supabase.co/storage/v1/object/public/')) { // Chequeo básico si es pública realmente
                console.log('URL pública no disponible o bucket no público, intentando URL firmada...');
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .createSignedUrl(filePath, expiresIn); // Usar expiresIn
                handleSupabaseError(signedUrlError, `Error creando URL firmada para ${filePath}`);
                accessUrl = signedUrlData?.signedUrl;
           }
   
           if (accessUrl) {
               console.log('URL obtenida:', accessUrl.substring(0, 100) + '...');
               return accessUrl;
           } else {
               throw new Error('No se pudo obtener una URL válida (pública o firmada) para el archivo.');
           }
   
       } catch (err) {
           console.error("Error en getDocumentUrl (Supabase):", err);
           throw err; // Relanzar el error
       }
}

/**
 * Descarga un archivo desde Supabase Storage.
 * @param {string} filePath - La ruta relativa del archivo en el bucket.
 * @param {string} [filename] - El nombre deseado para el archivo descargado.
 */
const downloadDocument = async (filePath, filename) => {
    if (!filePath) throw new Error('Ruta del archivo no proporcionada para la descarga.');
    const downloadName = filename || filePath.split('/').pop();

    console.log(`Intentando descargar: bucket=${BUCKET_NAME}, path=${filePath}, as=${downloadName}`);

    try {
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        let downloadUrl = publicUrlData?.publicUrl;

        if (!downloadUrl) {
            console.log('URL pública no disponible, intentando URL firmada...');
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 60 * 5);
            handleSupabaseError(signedUrlError, `Error creando URL firmada para ${filePath}`);
            downloadUrl = signedUrlData?.signedUrl;
        }

        if (downloadUrl) {
            console.log('URL obtenida:', downloadUrl.substring(0, 100) + '...');
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('Descarga iniciada para:', downloadName);
        } else {
            throw new Error('No se pudo obtener una URL válida (pública o firmada) para la descarga.');
        }

    } catch (err) {
        console.error("Error en downloadDocument (Supabase):", err);
        throw err;
    }
};

/**
 * Elimina un documento del Storage y de la base de datos.
 * @param {string} filePath - La ruta relativa del archivo en el bucket.
 * @returns {Promise<{success: boolean}>}
 */
const deleteDocument = async (filePath) => {
    if (!filePath) throw new Error('Ruta del archivo no proporcionada para eliminar.');

    console.log(`Eliminando documento: bucket=${BUCKET_NAME}, path=${filePath}`);

    // 1. Eliminar de la Base de Datos PRIMERO
    console.log(`Eliminando registro de DB para ruta: ${filePath}`);
    const { error: dbError, count } = await supabase
        .from(DOCUMENTS_TABLE)
        .delete({ count: 'exact' })
        .eq('ruta_archivo', filePath);
    handleSupabaseError(dbError, `Error eliminando registro de DB para ${filePath}`);

    if (count === 0) {
        console.warn(`No se encontró registro en la DB para la ruta: ${filePath}. Intentando eliminar de Storage...`);
    } else {
        console.log(`Registro de DB para ${filePath} eliminado.`);
    }

    // 2. Eliminar del Storage
    console.log(`Eliminando archivo de Storage: ${filePath}`);
    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (storageError) {
        console.error('Error eliminando del Storage (puede que ya no exista):', storageError);
    } else {
        console.log(`Archivo ${filePath} eliminado de Storage.`);
    }

    return { success: true };
};

// *** AÑADIDO: Definición del Hook dentro del servicio ***
/**
 * Hook para acceder fácilmente a las funciones del servicio de documentos.
 */
const useDocumentService = () => {
    // Simplemente devuelve un objeto con las funciones definidas arriba.
    return {
        useDocumentService,
        uploadDocument,
        getDocuments,
        downloadDocument,
        deleteDocument,
        getDocumentUrl,
        // Añade aquí cualquier otra función que agregues al servicio
    };
};

// *** ACTUALIZADO: Exporta también el hook ***
export {
    useDocumentService, // Exporta el hook
    getDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getDocumentUrl,
};
