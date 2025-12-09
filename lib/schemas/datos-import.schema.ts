import { z } from 'zod';

// Schema para validar datos de importación (idéntico al del backend)
export const datosImportSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  apellido: z.string().min(1, 'Apellido es requerido'),
  edad: z.number({
    required_error: 'Edad es requerida',
    invalid_type_error: 'Edad debe ser un número',
  }).int().positive('Edad debe ser un número positivo'),
  nacimiento: z.string().nullable().optional(),
  id_estaca: z.number({
    required_error: 'ID de estaca es requerido',
    invalid_type_error: 'ID de estaca debe ser un número',
  }).int().positive('ID de estaca es requerido'),
  id_barrio: z.number({
    required_error: 'ID de barrio es requerido',
    invalid_type_error: 'ID de barrio debe ser un número',
  }).int().positive('ID de barrio es requerido'),
  id_comp: z.number({
    required_error: 'ID de comp es requerido',
    invalid_type_error: 'ID de comp debe ser un número',
  }).int().positive('ID de comp es requerido'),
  id_habitacion: z.number({
    required_error: 'ID de habitación es requerido',
    invalid_type_error: 'ID de habitación debe ser un número',
  }).int().positive('ID de habitación es requerido'),
  telefono: z.string().nullable().optional(),
  sexo: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Sexo debe ser M o F' }),
  }),
  tipo: z.enum(['Staff', 'Participante'], {
    errorMap: () => ({ message: 'Tipo debe ser Staff o Participante' }),
  }),
  correo: z.string().email('Correo inválido').nullable().optional().or(z.literal('')),
  talla: z.string().nullable().optional(),
  nom_c1: z.string().nullable().optional(),
  telef_c1: z.string().nullable().optional(),
  grupo_sang: z.string().nullable().optional(),
  miembro: z.enum(['Si', 'No']).nullable().optional(),
  enf_cronica: z.string().max(500).nullable().optional(),
  trat_med: z.string().max(500).nullable().optional(),
  seguro: z.string().max(500).nullable().optional(),
  alergia_med: z.string().max(500).nullable().optional(),
  dieta: z.enum(['Si', 'No']).nullable().optional(),
  obs_dieta: z.string().max(500).nullable().optional(),
  alergia_alimento: z.enum(['Si', 'No']).nullable().optional(),
  alergia_medicamento: z.enum(['Si', 'No']).nullable().optional(),
  alergia_polvo_pelos_acaro: z.enum(['Si', 'No']).nullable().optional(),
});

export type DatosImport = z.infer<typeof datosImportSchema>;

// Tipo para errores de validación
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}
