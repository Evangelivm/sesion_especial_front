import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:3000";

interface ParticipanteStats {
  id: number;
  nombres: string;
  sexo: "H" | "M";
  estaca: string;
  barrio: string;
  compañia: number;
  habitacion: string;
  asistio: "Si" | "No";
  dieta?: "Si" | "No";
  obs_dieta?: string;
}

// Función para obtener la lista de participantes
export const getParticipantes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/part`);
    // Mapea los datos para extraer los campos necesarios
    const participantes = response.data.map((participante: any) => ({
      id: participante.id,
      name: participante.name,
      compania: participante.compania || "N/A",
    }));
    return participantes;
  } catch (error) {
    console.error("Error al obtener los participantes:", error);
    throw error;
  }
};

// Nueva función para registrar un participante
export const registerParticipante = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/part/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al registrar el participante:", error);
    throw error;
  }
};

// Función para obtener los participantes para atención médica
export const getParticipantesSalud = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/salud`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los participantes para salud:", error);
    throw error;
  }
};

// Función para obtener los miembros de una compañía
export const getCompanyMembers = async (companyId: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/stats/${companyId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error al obtener los miembros de la compañía ${companyId}:`,
      error
    );
    throw error;
  }
};

// Función para buscar un participante por ID
export const buscarParticipante = async (id: number) => {
  try {
    //console.log(`Iniciando búsqueda para ID: ${id}`);
    const response = await axios.get(`${BASE_URL}/part/${id}`);
    //console.log("Respuesta del servidor:", response.data[0]);

    // Verificar si la respuesta tiene datos
    if (!response.data || !response.data[0]) {
      throw new Error("No se encontraron datos del participante");
    }

    // Mapea los datos para extraer los campos necesarios
    const participante = {
      id: response.data[0].id,
      compania: response.data[0].comp || "No asignada",
      nombres: response.data[0].nombre || "",
      apellidos: response.data[0].apellido || "",
      habitacion: response.data[0].habitacion || "Sin asignar",
      edad: response.data[0].edad || 0,
      estaca: response.data[0].estaca || "",
      barrio: response.data[0].barrio || "",
      asistio: response.data[0].asistio || "No",
    };

    //console.log("Datos mapeados del participante:", participante);
    return participante;
  } catch (error) {
    console.error("Error detallado al buscar el participante:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Mensaje:", error.response?.data);
    }
    throw error;
  }
};

export const buscarParticipanteCompleto = async (id: number) => {
  try {
    //console.log(`Iniciando búsqueda para ID: ${id}`);
    const response = await axios.get(`${BASE_URL}/part/full/${id}`);
    //console.log("Respuesta del servidor:", response.data[0]);

    // Verificar si la respuesta tiene datos
    if (!response.data || !response.data[0]) {
      throw new Error("No se encontraron datos del participante");
    }

    // Mapea los datos para extraer los campos necesarios
    const participante = {
      id: response.data[0].id,
      compania: response.data[0].comp || "No asignada",
      nombres: response.data[0].nombre || "",
      apellidos: response.data[0].apellido || "",
      habitacion: response.data[0].habitacion || "Sin asignar",
      edad: response.data[0].edad || 0,
      estaca: response.data[0].estaca || "",
      barrio: response.data[0].barrio || "",
      asistio: response.data[0].asistio || "No",
      telefono: response.data[0].telefono || "",
      nacimiento: response.data[0].nacimiento || "",
      talla: response.data[0].talla || "",
      tipo: response.data[0].tipo || "",
      sexo: response.data[0].sexo || "",
      correo: response.data[0].correo || "",
      nom_c1: response.data[0].nom_c1 || "",
      telef_c1: response.data[0].telef_c1 || "",
      grupo_sang: response.data[0].grupo_sang || "",
      miembro: response.data[0].miembro || "",
      enf_cronica: response.data[0].enf_cronica || "",
      trat_med: response.data[0].trat_med || "",
      seguro: response.data[0].seguro || "",
      alergia_med: response.data[0].alergia_med || "",
      dieta: response.data[0].dieta || null,
      obs_dieta: response.data[0].obs_dieta || null,
      alergia_alimento: response.data[0].alergia_alimento || null,
      alergia_medicamento: response.data[0].alergia_medicamento || null,
      alergia_polvo_pelos_acaro: response.data[0].alergia_polvo_pelos_acaro || null,
    };

    //console.log("Datos mapeados del participante:", participante);
    return participante;
  } catch (error) {
    console.error("Error detallado al buscar el participante:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Mensaje:", error.response?.data);
    }
    throw error;
  }
};

// Función para confirmar la asistencia de un participante
export const confirmarAsistencia = async (id: number) => {
  try {
    //console.log(`Confirmando asistencia para ID: ${id}`);
    const response = await axios.put(`${BASE_URL}/part/${id}`);
    //console.log("Respuesta del servidor:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al confirmar la asistencia:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Mensaje:", error.response?.data);
    }
    throw error;
  }
};

// Función para obtener las estadísticas de los participantes
export const getStats = async (): Promise<ParticipanteStats[]> => {
  try {
    console.log("Iniciando obtención de estadísticas");
    const response = await axios.get(`${BASE_URL}/stats`);
    console.log("Datos de estadísticas recibidos:", response.data);

    if (!response.data) {
      throw new Error("No se encontraron datos estadísticos");
    }

    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Mensaje:", error.response?.data);
    }
    throw error;
  }
};

// Función para agregar un nuevo medicamento al inventario
export const agregarMedicamento = async (
  nombre: string,
  descripcion: string,
  stock: number,
  dosis: string | undefined
) => {
  try {
    const response = await axios.post(`${BASE_URL}/salud/inv/`, {
      nombre,
      descripcion,
      stock,
      dosis,
    });
    return response.data;
  } catch (error) {
    console.error("Error al agregar el medicamento:", error);
    throw error;
  }
};

// Función para obtener el inventario de medicamentos
export const getInventarioMedicamentos = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/salud/inv/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el inventario de medicamentos:", error);
    throw error;
  }
};

// Nueva función para eliminar un medicamento del inventario
export const eliminarMedicamento = async (id: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}/salud/inv/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el medicamento:", error);
    throw error;
  }
};

// Nueva función para actualizar un medicamento en el inventario
export const actualizarMedicamento = async (
  id: number,
  nombre: string,
  descripcion: string,
  stock: number,
  dosis: string | null
) => {
  try {
    const response = await axios.put(`${BASE_URL}/salud/inv/${id}`, {
      nombre,
      descripcion,
      stock,
      dosis,
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el medicamento:", error);
    throw error;
  }
};

// Nueva función para registrar una atención médica
export const registrarAtencion = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/salud/atencion/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al registrar la atención médica:", error);
    throw error;
  }
};

// Nueva función para obtener el historial de atenciones médicas
export const getHistorialAtenciones = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/salud/atencion/`);
    return response.data;
  } catch (error) {
    console.error(
      "Error al obtener el historial de atenciones médicas:",
      error
    );
    throw error;
  }
};

// Nueva función para obtener atenciones médicas por ID de participante
export const getAtencionesByParticipanteId = async (id_datos: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/salud/atencion/part/${id_datos}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error al obtener atenciones médicas para el participante ${id_datos}:`,
      error
    );
    throw error;
  }
};

// ============================================================================
// FUNCIONES DE PERMUTAS
// ============================================================================

// Función para intercambiar dos participantes entre compañías
export const intercambiarParticipantes = async (
  persona1Id: number,
  persona2Id: number
) => {
  try {
    const response = await axios.post(`${BASE_URL}/permuta/intercambio`, {
      persona1_id: persona1Id,
      persona2_id: persona2Id,
    });
    return response.data;
  } catch (error) {
    console.error("Error al intercambiar participantes:", error);
    throw error;
  }
};

// Función para cambiar un participante de compañía
export const cambiarCompania = async (
  personaId: number,
  nuevaCompaniaId: number
) => {
  try {
    const response = await axios.post(`${BASE_URL}/permuta/cambio`, {
      persona_id: personaId,
      nueva_compania_id: nuevaCompaniaId,
    });
    return response.data;
  } catch (error) {
    console.error("Error al cambiar compañía:", error);
    throw error;
  }
};

// Función para obtener el historial de permutas (opcional)
export const getHistorialPermutas = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/permuta/historial`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener historial de permutas:", error);
    throw error;
  }
};

// Función para obtener todas las compañías disponibles
export const getCompanias = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/permuta/companias`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener compañías:", error);
    throw error;
  }
};

// ============================================================================
// FUNCIONES DE IMPORTACIÓN MASIVA
// ============================================================================

// Función para importar datos masivamente desde Excel
export const importarDatosMasivos = async (datos: any[]) => {
  try {
    const response = await axios.post(`${BASE_URL}/import-datos/bulk`, {
      datos,
    });
    return response.data;
  } catch (error) {
    console.error("Error al importar datos masivos:", error);
    throw error;
  }
};

// ============================================================================
// FUNCIONES DE HABITACIONES
// ============================================================================

// Función para obtener todas las habitaciones con sus ocupantes
export const getHabitaciones = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/habitaciones`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener las habitaciones:", error);
    throw error;
  }
};
