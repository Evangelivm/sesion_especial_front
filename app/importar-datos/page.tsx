'use client';

import { useState } from 'react';
import ExcelJS from 'exceljs';
import { datosImportSchema, DatosImport, ValidationError } from '@/lib/schemas/datos-import.schema';
import { importarDatosMasivos } from '@/lib/connections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportarDatosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [validData, setValidData] = useState<DatosImport[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidData([]);
    setErrors([]);
    setUploadSuccess(false);
    await processExcelFile(selectedFile);
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        toast.error('El archivo Excel está vacío');
        return;
      }

      const data: any[] = [];
      const validationErrors: ValidationError[] = [];

      // Leer datos (asumiendo que la primera fila son headers)
      const rows = worksheet.getSheetValues();

      // Obtener headers (primera fila)
      const headers = rows[1] as any[];

      // Procesar cada fila (empezando desde la segunda)
      for (let rowIndex = 2; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] as any[];
        if (!row || row.length === 0) continue;

        // Crear objeto basado en headers
        const rowData: any = {};
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex] !== undefined) {
            rowData[header] = row[colIndex];
          }
        });

        // Validar con Zod
        const result = datosImportSchema.safeParse(rowData);

        if (result.success) {
          data.push(result.data);
        } else {
          // Agregar errores de validación
          result.error.errors.forEach((err) => {
            validationErrors.push({
              row: rowIndex,
              field: err.path.join('.'),
              message: err.message,
              value: rowData[err.path[0]],
            });
          });
        }
      }

      setValidData(data);
      setErrors(validationErrors);

      if (data.length > 0) {
        toast.success(`${data.length} registros válidos encontrados`);
      }
      if (validationErrors.length > 0) {
        toast.warning(`${validationErrors.length} errores de validación encontrados`);
      }
    } catch (error: any) {
      toast.error(`Error al procesar el archivo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (validData.length === 0) {
      toast.error('No hay datos válidos para importar');
      return;
    }

    setIsUploading(true);
    try {
      const result = await importarDatosMasivos(validData);
      toast.success(result.message || 'Datos importados exitosamente');
      setUploadSuccess(true);

      // Limpiar después de 3 segundos
      setTimeout(() => {
        setFile(null);
        setValidData([]);
        setErrors([]);
        setUploadSuccess(false);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar datos';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar Datos desde Excel</h1>
          <p className="text-muted-foreground mt-2">
            Sube un archivo Excel con los datos de participantes para importarlos masivamente
          </p>
        </div>
      </div>

      {/* Card de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo</CardTitle>
          <CardDescription>
            El archivo Excel debe tener las columnas correctamente nombradas según el esquema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isProcessing || isUploading}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isProcessing || isUploading}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar Excel
                </span>
              </Button>
            </label>
            {file && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{file.name}</span>
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {(validData.length > 0 || errors.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Procesados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validData.length + errors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Válidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{validData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Con Errores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{errors.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errores */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Se encontraron errores de validación</AlertTitle>
          <AlertDescription>
            Corrige los errores en el archivo Excel y vuelve a subirlo
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla de Errores */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Errores Encontrados</CardTitle>
            <CardDescription>
              Lista de errores de validación por fila
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fila</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 50).map((error, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{error.field}</Badge>
                      </TableCell>
                      <TableCell className="text-red-500">{error.message}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {error.value !== null && error.value !== undefined
                          ? String(error.value)
                          : '(vacío)'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {errors.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 50 de {errors.length} errores
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Previa de Datos Válidos */}
      {validData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Datos Válidos</CardTitle>
            <CardDescription>
              Registros que serán importados (mostrando primeros 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Teléfono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validData.slice(0, 10).map((dato, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{dato.nombre}</TableCell>
                      <TableCell>{dato.apellido}</TableCell>
                      <TableCell>{dato.edad}</TableCell>
                      <TableCell>{dato.sexo}</TableCell>
                      <TableCell>
                        <Badge variant={dato.tipo === 'Staff' ? 'default' : 'secondary'}>
                          {dato.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{dato.telefono || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {validData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 10 de {validData.length} registros válidos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de Importar */}
      {validData.length > 0 && errors.length === 0 && (
        <div className="flex justify-end gap-4">
          <Button
            size="lg"
            onClick={handleUpload}
            disabled={isUploading || uploadSuccess}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Importado Exitosamente
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar {validData.length} Registros
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
