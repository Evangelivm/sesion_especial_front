"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
  Droplet,
  HeartCrack,
  Pill,
  Syringe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import gsap from "gsap";
import {
  getParticipantesSalud,
  getInventarioMedicamentos, // Import getInventarioMedicamentos
  registrarAtencion, // Import registrarAtencion
} from "@/lib/connections";
import { useDebounce } from "@/hooks/use-debounce";

// Tipos de datos
interface Participante {
  id: number;
  nombres: string;
  edad: number;
  sexo: string;
  comp: string;
  grupo_sang: string;
  enf_cronica: string;
  trat_med: string;
  alergia_med: string | null;
  dieta?: "Si" | "No" | null;
  obs_dieta?: string | null;
  alergia_alimento?: "Si" | "No" | null;
  alergia_medicamento?: "Si" | "No" | null;
  alergia_polvo_pelos_acaro?: "Si" | "No" | null;
}
interface MedicamentoSeleccionado {
  id: number; // ID del medicamento del inventario
  frecuencia: string; // Ej: "Cada 8 horas", "1 vez al dia"
  duracion: string; // Ej: "7 dias", "1 semana"
  unidadesDadas: number; // Cantidad de unidades dadas
}

interface Medication {
  id_inventario_salud: number;
  nombre: string;
  descripcion: string;
  stock: number;
  dosis?: string | null;
}

interface AtencionMedica {
  participanteId: number | null;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  tratamiento: string;
  // Cambiar el tipo de medicamentos
  medicamentos: MedicamentoSeleccionado[];
  seguimiento: boolean;
  fechaSeguimiento?: string;
  horaSeguimiento?: string;
}

export default function AtencionMedicaPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [busquedaParticipante, setBusquedaParticipante] = useState("");
  const debouncedBusqueda = useDebounce(busquedaParticipante, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [participanteSeleccionado, setParticipanteSeleccionado] =
    useState<Participante | null>(null);
  const [mostrarBusquedaParticipante, setMostrarBusquedaParticipante] =
    useState(false);
  const [seDioMedicamentos, setSeDioMedicamentos] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]); // Medication inventory
  const [busquedaMedicamento, setBusquedaMedicamento] = useState("");
  const debouncedBusquedaMedicamento = useDebounce(busquedaMedicamento, 300);
  const [mostarBusquedaMedicamento, setMostarBusquedaMedicamento] =
    useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Refs for step content animations
  const paso1Ref = useRef<HTMLDivElement>(null);
  const paso2Ref = useRef<HTMLDivElement>(null);
  const paso3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        const data = await getParticipantesSalud();
        setParticipantes(data);
      } catch (error) {
        toast.error("Error al cargar la lista de participantes.");
      }
    };

    const fetchMedications = async () => {
      try {
        const data = await getInventarioMedicamentos();
        setMedications(data as Medication[]);
      } catch (error) {
        toast.error("Error al cargar el inventario de medicamentos.");
      }
    };

    fetchParticipantes();
    fetchMedications();
  }, []);

  // Clear medications if "Se le dio Medicamentos" is unchecked
  useEffect(() => {
    if (!seDioMedicamentos) {
      setAtencion((prev) => ({
        ...prev,
        medicamentos: [],
      }));
    }
  }, [seDioMedicamentos]);

  // Animation timeline ref
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Estado principal del formulario
  const [atencion, setAtencion] = useState<AtencionMedica>({
    participanteId: null,
    fecha: new Date().toISOString().split("T")[0],
    hora: new Date().toTimeString().split(" ")[0].substring(0, 5),
    motivoConsulta: "",
    tratamiento: "",
    medicamentos: [], // Array of medication IDs
    seguimiento: false,
    fechaSeguimiento: "",
    horaSeguimiento: "",
  });

  // Initialize step animations and update time
  useEffect(() => {
    // Set initial states for all steps
    const pasosRefs = [paso1Ref, paso2Ref, paso3Ref];

    pasosRefs.forEach((ref, index) => {
      if (ref.current && index > 0) {
        // Skip the first step (paso 1) as it's visible by default
        gsap.set(ref.current, {
          opacity: 0,
          x: 20,
          display: "none",
        });
      }
    });

    // Update time every second
    const timer = setInterval(() => {
      setAtencion((prev) => ({
        ...prev,
        // Muestra HH:MM:SS para que se vea el movimiento
        hora: new Date().toTimeString().split(" ")[0].substring(0, 8),
      }));
    }, 1000);

    return () => {
      clearInterval(timer); // Limpia el intervalo al desmontar el componente
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  // Helper to get the correct ref based on step number
  const getPasoRef = (pasoNum: number) => {
    switch (pasoNum) {
      case 1:
        return paso1Ref;
      case 2:
        return paso2Ref;
      case 3:
        return paso3Ref;
      default:
        return paso1Ref;
    }
  };

  // Filtrar participantes según la búsqueda
  const participantesFiltrados = participantes.filter((p) =>
    p.nombres.toLowerCase().includes(debouncedBusqueda.toLowerCase())
  );

  // Seleccionar participante
  const seleccionarParticipante = (participante: Participante) => {
    setParticipanteSeleccionado(participante);
    setAtencion({ ...atencion, participanteId: participante.id });
    setMostrarBusquedaParticipante(false);
    toast.success(`Participante seleccionado: ${participante.nombres}`);
  };

  const agregarMedicamento = (id: number) => {
    // Verificar si el medicamento ya está en la lista
    if (!atencion.medicamentos.some((med) => med.id === id)) {
      setAtencion((prev) => ({
        ...prev,
        medicamentos: [
          ...prev.medicamentos,
          { id, frecuencia: "", duracion: "", unidadesDadas: 0 }, // Agregar objeto con campos vacíos y unidadesDadas
        ],
      }));
      setMostarBusquedaMedicamento(false); // Cerrar el selector de medicamentos
    } else {
      toast.error("Este medicamento ya fue agregado");
    }
  };

  // Eliminar medicamento
  const eliminarMedicamento = (index: number) => {
    const nuevosMedicamentos = [...atencion.medicamentos];
    nuevosMedicamentos.splice(index, 1);
    setAtencion({ ...atencion, medicamentos: nuevosMedicamentos });
  };
  // Nueva función para actualizar frecuencia o duracion
  const actualizarMedicamento = (
    index: number,
    campo: keyof MedicamentoSeleccionado,
    valor: string | number
  ) => {
    const nuevosMedicamentos = [...atencion.medicamentos];
    if (nuevosMedicamentos[index]) {
      // Aserción de tipo para evitar error de compilación en campo dinámico
      (nuevosMedicamentos[index] as any)[campo] = valor;
      setAtencion({ ...atencion, medicamentos: nuevosMedicamentos });
    }
  };
  // Avanzar al siguiente paso
  const siguientePaso = () => {
    // Validaciones según el paso actual
    if (paso === 1 && !participanteSeleccionado) {
      toast.error("Debe seleccionar un participante");
      return;
    }

    if (paso === 2 && atencion.motivoConsulta.trim() === "") {
      toast.error("Debe ingresar el motivo de consulta");
      return;
    }

    if (paso < 3) {
      setPaso(paso + 1);
    }
  };

  // Retroceder al paso anterior
  const pasoAnterior = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  // Función para mostrar el panel de confirmación
  const handleGuardarAtencion = () => {
    if (atencion.tratamiento.trim() === "") {
      toast.error("Debe ingresar el diagnóstico");
      return;
    }
    setMostrarConfirmacion(true);
  };

  // Enviar formulario (lógica real de envío)
  const enviarFormularioConfirmado = async () => {
    const {
      fecha,
      hora,
      fechaSeguimiento,
      horaSeguimiento,
      participanteId,
      ...restOfAtencion
    } = atencion;
    const dataToSend: any = {
      ...restOfAtencion,
      datos_id: participanteId,
      fecha_consulta: new Date(`${fecha}T${hora}`),
    };

    if (atencion.seguimiento && fechaSeguimiento && horaSeguimiento) {
      dataToSend.fecha_seguimiento = new Date(
        `${fechaSeguimiento}T${horaSeguimiento}`
      );
    }
    try {
      await registrarAtencion(dataToSend);
      toast.success("Atención médica registrada correctamente");
      router.push("/historial-atenciones");
    } catch (error) {
      toast.error("Error al registrar la atención médica.");
      console.error("Error al enviar datos:", error);
    }
  };

  const medicamentosFiltrados = medications.filter((m) =>
    m.nombre.toLowerCase().includes(debouncedBusquedaMedicamento.toLowerCase())
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 pb-10">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center">
        <button onClick={() => router.push("/")} className="text-white mr-2">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-white">
          Registro de Atención Médica
        </h1>
      </div>

      {/* Progreso */}
      <div className="w-full max-w-md px-4 mt-4">
        <div className="mb-4">
          <div className="grid grid-cols-3 text-center text-xs text-slate-500 mb-1">
            <span>Participante</span>
            <span>Consulta</span>
            <span>Atencion de Tópico</span>
          </div>
          <Progress value={((paso - 0.5) / 3) * 100} className="h-2" />
        </div>

        {/* Paso 1: Selección de Participante */}
        {paso === 1 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Seleccionar Participante
              </CardTitle>
              <CardDescription>
                Busque y seleccione al participante que recibirá la atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                    onClick={() => setMostrarBusquedaParticipante(true)}
                  >
                    <Search className="h-4 w-4 mr-2 opacity-50" />
                    {participanteSeleccionado
                      ? participanteSeleccionado.nombres
                      : "Buscar participante..."}
                  </Button>

                  {mostrarBusquedaParticipante && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-10">
                      <CardHeader className="py-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre..."
                            className="pl-8"
                            value={busquedaParticipante}
                            onChange={(e) =>
                              setBusquedaParticipante(e.target.value)
                            }
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="max-h-64 overflow-y-auto py-2">
                        {participantesFiltrados.length > 0 ? (
                          <>
                            <div className="space-y-1">
                              {participantesFiltrados
                                .slice(0, visibleCount)
                                .map((participante) => (
                                  <div
                                    key={participante.id}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                    onClick={() =>
                                      seleccionarParticipante(participante)
                                    }
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {participante.nombres}
                                      </p>
                                      <div className="flex items-center text-sm text-slate-500">
                                        <span>{participante.edad} años</span>
                                        <span className="mx-1">•</span>
                                        <span>
                                          {participante.sexo === "H"
                                            ? "Hombre"
                                            : "Mujer"}
                                        </span>
                                        <span className="mx-1">•</span>
                                        <span>
                                          {participante.comp === "Staff"
                                            ? "Staff"
                                            : `Compañía ${participante.comp}`}
                                        </span>
                                      </div>
                                    </div>
                                    <Check className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100" />
                                  </div>
                                ))}
                            </div>
                            {visibleCount < participantesFiltrados.length && (
                              <Button
                                variant="link"
                                className="w-full mt-2"
                                onClick={() =>
                                  setVisibleCount((prev) => prev + 20)
                                }
                              >
                                Cargar más
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="py-3 text-center text-sm text-slate-500">
                            No se encontraron participantes
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {participanteSeleccionado && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {participanteSeleccionado.nombres}
                        </h3>
                        <div className="text-sm text-slate-500 mt-1">
                          <p>
                            {participanteSeleccionado.edad} años •
                            {participanteSeleccionado.sexo === "H"
                              ? " Hombre"
                              : " Mujer"}
                          </p>
                          <p>
                            {participanteSeleccionado.comp === "Staff"
                              ? "Staff"
                              : `Compañía ${participanteSeleccionado.comp}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setParticipanteSeleccionado(null);
                          setAtencion({ ...atencion, participanteId: null });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button size="lg" onClick={siguientePaso}>
                Siguiente
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Paso 2: Datos de la Consulta */}
        {paso === 2 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              {participanteSeleccionado && (
                <CardTitle className="text-lg mb-2">
                  {participanteSeleccionado.comp === "Staff"
                    ? "(Staff)"
                    : `C${participanteSeleccionado.comp} -`}{" "}
                  {participanteSeleccionado.nombres}{" "}
                  {`(${participanteSeleccionado.edad})`}
                </CardTitle>
              )}
              <CardTitle className="text-lg">Datos de la Consulta</CardTitle>
              <CardDescription>
                Ingrese la información sobre la consulta médica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={atencion.fecha}
                      onChange={(e) =>
                        setAtencion({ ...atencion, fecha: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={atencion.hora}
                      readOnly
                      onChange={(e) =>
                        setAtencion({ ...atencion, hora: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivoConsulta">
                    Motivo de Consulta / Síntomas
                  </Label>
                  <Textarea
                    id="motivoConsulta"
                    placeholder="Describa el motivo de la consulta"
                    className="min-h-[100px] text-base"
                    value={atencion.motivoConsulta}
                    onChange={(e) =>
                      setAtencion({
                        ...atencion,
                        motivoConsulta: e.target.value,
                      })
                    }
                  />
                  {atencion.motivoConsulta.trim() === "" && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Este campo es obligatorio
                    </p>
                  )}
                </div>

                {participanteSeleccionado && (
                  <div className="space-y-2">
                    <Separator className="my-4" />
                    <h3 className="font-medium text-slate-700 flex items-center">
                      Información de Salud del Participante:
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Droplet className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          <span className="font-medium">Tipo de Sangre:</span>{" "}
                          {participanteSeleccionado.grupo_sang}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <HeartCrack className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          <span className="font-medium">
                            Enfermedad Crónica:
                          </span>{" "}
                          {participanteSeleccionado.enf_cronica || "Ninguna"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Pill className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          <span className="font-medium">
                            Tratamiento Médico:
                          </span>{" "}
                          {participanteSeleccionado.trat_med || "Ninguno"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Syringe className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          <span className="font-medium">
                            Alergia a Medicamentos:
                          </span>{" "}
                          {participanteSeleccionado.alergia_med || "Ninguna"}
                        </span>
                      </div>
                    </div>

                    {/* Alertas de Alergias */}
                    {(participanteSeleccionado.alergia_alimento === "Si" ||
                      participanteSeleccionado.alergia_medicamento === "Si" ||
                      participanteSeleccionado.alergia_polvo_pelos_acaro === "Si") && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 mb-1">
                              ⚠️ ALERGIAS REGISTRADAS:
                            </p>
                            <ul className="text-xs text-red-700 space-y-1">
                              {participanteSeleccionado.alergia_alimento === "Si" && (
                                <li>• Alergia a alimentos</li>
                              )}
                              {participanteSeleccionado.alergia_medicamento === "Si" && (
                                <li>• Alergia a medicamentos</li>
                              )}
                              {participanteSeleccionado.alergia_polvo_pelos_acaro === "Si" && (
                                <li>• Alergia a polvo/pelos/ácaros</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alerta de Dieta Especial */}
                    {participanteSeleccionado.dieta === "Si" && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 mb-1">
                              🍽️ DIETA ESPECIAL
                            </p>
                            {participanteSeleccionado.obs_dieta && (
                              <p className="text-xs text-amber-700">
                                {participanteSeleccionado.obs_dieta}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className="my-4" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="lg" onClick={pasoAnterior}>
                Atrás
              </Button>
              <Button size="lg" onClick={siguientePaso}>
                Siguiente
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Paso 3: Tratamiento */}
        {paso === 3 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Atención de Tópico</CardTitle>
              <CardDescription>
                Describa la atención de tópico y medicamentos recetados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tratamiento">Diagnóstico</Label>
                  <Textarea
                    id="tratamiento"
                    placeholder="Describa el diagnóstico"
                    className="min-h-[100px] text-base"
                    value={atencion.tratamiento}
                    onChange={(e) =>
                      setAtencion({ ...atencion, tratamiento: e.target.value })
                    }
                  />
                  {atencion.tratamiento.trim() === "" && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Este campo es obligatorio
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seDioMedicamentos"
                    checked={seDioMedicamentos}
                    onCheckedChange={(checked) =>
                      setSeDioMedicamentos(checked as boolean)
                    }
                  />
                  <Label htmlFor="seDioMedicamentos" className="cursor-pointer">
                    Se le dió Medicamentos
                  </Label>
                </div>

                {seDioMedicamentos && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto py-3 text-left"
                        onClick={() =>
                          setMostarBusquedaMedicamento(
                            !mostarBusquedaMedicamento
                          )
                        } // Toggle the state
                      >
                        <Search className="h-4 w-4 mr-2 opacity-50" />
                        {atencion.medicamentos.length > 0
                          ? "Medicamentos Agregados"
                          : "Buscar Medicamento..."}
                      </Button>

                      {mostarBusquedaMedicamento && (
                        <Card className="absolute top-full left-0 right-0 mt-1 z-10">
                          <CardHeader className="py-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre..."
                                className="pl-8"
                                value={busquedaMedicamento}
                                onChange={(e) =>
                                  setBusquedaMedicamento(e.target.value)
                                }
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="max-h-64 overflow-y-auto py-2">
                            {medicamentosFiltrados.length > 0 ? (
                              <>
                                <div className="space-y-1">
                                  {medicamentosFiltrados.map((medicamento) => (
                                    <div
                                      key={medicamento.id_inventario_salud}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                      onClick={() =>
                                        agregarMedicamento(
                                          medicamento.id_inventario_salud
                                        )
                                      }
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {medicamento.nombre}
                                        </p>
                                        <div className="flex items-center text-sm text-slate-500">
                                          <span>
                                            Stock: {medicamento.stock}
                                          </span>
                                          <span className="mx-1">•</span>
                                          <span>
                                            Dosis:{" "}
                                            {medicamento.dosis
                                              ? medicamento.dosis
                                              : "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <Check className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100" />
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="py-3 text-center text-sm text-slate-500">
                                No se encontraron medicamentos
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      {atencion.medicamentos.length > 0 ? (
                        <div className="space-y-2">
                          {atencion.medicamentos.map(
                            (medSeleccionado, index) => {
                              // Buscar el objeto completo del medicamento en base al ID
                              const medicamentoCompleto = medications.find(
                                (m) =>
                                  m.id_inventario_salud === medSeleccionado.id
                              );
                              if (!medicamentoCompleto) return null; // O manejar el caso donde no se encuentra

                              return (
                                <div
                                  key={`${medSeleccionado.id}-${index}`} // Key único basado en ID e índice
                                  className="bg-slate-50 p-3 rounded-md border border-slate-200"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium">
                                        {medicamentoCompleto.nombre}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        Stock: {medicamentoCompleto.stock} •
                                        Dosis:{" "}
                                        {medicamentoCompleto.dosis
                                          ? medicamentoCompleto.dosis
                                          : "N/A"}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => eliminarMedicamento(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`frecuencia-${index}`}
                                        className="text-xs"
                                      >
                                        Frecuencia
                                      </Label>
                                      <Input
                                        id={`frecuencia-${index}`}
                                        type="text"
                                        placeholder="Ej: Cada 8 horas"
                                        value={medSeleccionado.frecuencia}
                                        onChange={(e) =>
                                          actualizarMedicamento(
                                            index,
                                            "frecuencia",
                                            e.target.value
                                          )
                                        }
                                        className="text-sm h-8"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`duracion-${index}`}
                                        className="text-xs"
                                      >
                                        Duración
                                      </Label>
                                      <Input
                                        id={`duracion-${index}`}
                                        type="text"
                                        placeholder="Ej: 7 días"
                                        value={medSeleccionado.duracion}
                                        onChange={(e) =>
                                          actualizarMedicamento(
                                            index,
                                            "duracion",
                                            e.target.value
                                          )
                                        }
                                        className="text-sm h-8"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`unidades-dadas-${index}`}
                                        className="text-xs"
                                      >
                                        Unidades Dadas
                                      </Label>
                                      <Input
                                        id={`unidades-dadas-${index}`}
                                        type="number"
                                        placeholder="Ej: 10"
                                        value={medSeleccionado.unidadesDadas}
                                        onChange={(e) =>
                                          actualizarMedicamento(
                                            index,
                                            "unidadesDadas",
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="text-sm h-8"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 rounded-md border border-slate-200">
                          No hay medicamentos agregados
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seguimiento"
                    checked={atencion.seguimiento}
                    onCheckedChange={(checked) =>
                      setAtencion({
                        ...atencion,
                        seguimiento: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="seguimiento" className="cursor-pointer">
                    Requiere seguimiento
                  </Label>
                </div>

                {atencion.seguimiento && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaSeguimiento">
                        Fecha de Seguimiento
                      </Label>
                      <Input
                        id="fechaSeguimiento"
                        type="date"
                        value={atencion.fechaSeguimiento}
                        onChange={(e) =>
                          setAtencion({
                            ...atencion,
                            fechaSeguimiento: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horaSeguimiento">
                        Hora de Seguimiento
                      </Label>
                      <Input
                        id="horaSeguimiento"
                        type="time"
                        value={atencion.horaSeguimiento}
                        onChange={(e) =>
                          setAtencion({
                            ...atencion,
                            horaSeguimiento: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="lg" onClick={pasoAnterior}>
                Atrás
              </Button>
              <Button size="lg" onClick={handleGuardarAtencion}>
                Guardar Atención
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Panel de Confirmación */}
      <AlertDialog
        open={mostrarConfirmacion}
        onOpenChange={setMostrarConfirmacion}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Atención Médica</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, revise cuidadosamente toda la información ingresada.
              Una vez confirmada, la atención será registrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Participante:</strong> {participanteSeleccionado?.nombres}
            </p>
            <p>
              <strong>Fecha y Hora:</strong> {atencion.fecha} {atencion.hora}
            </p>
            <p>
              <strong>Motivo de Consulta:</strong> {atencion.motivoConsulta}
            </p>
            <p>
              <strong>Diagnóstico:</strong> {atencion.tratamiento}
            </p>
            {atencion.medicamentos.length > 0 && (
              <div>
                <p>
                  <strong>Medicamentos:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {atencion.medicamentos.map((med, index) => {
                    const medInfo = medications.find(
                      (m) => m.id_inventario_salud === med.id
                    );
                    return (
                      <li key={index}>
                        {medInfo?.nombre} - Frecuencia: {med.frecuencia},
                        Duración: {med.duracion}, Unidades: {med.unidadesDadas}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {atencion.seguimiento && (
              <p>
                <strong>Seguimiento:</strong> Sí, el {atencion.fechaSeguimiento}{" "}
                a las {atencion.horaSeguimiento}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={enviarFormularioConfirmado}>
              Confirmar y Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
