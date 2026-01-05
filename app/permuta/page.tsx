"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeftRight,
  MoveRight,
  ChevronLeft,
  Users,
  User,
  RefreshCcw,
  Search,
  Check,
  X as XIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getParticipantes,
  intercambiarParticipantes,
  cambiarCompania as cambiarCompaniaAPI,
  getCompanias,
  cambioCompuesto as cambioCompuestoAPI,
  buscarParticipanteCompleto,
} from "@/lib/connections";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

interface Participante {
  id: number;
  name: string;
  compania?: string;
}

interface Compania {
  id_comp: number;
  comp: string;
}


interface CompanyData {
  id_comp: number;
  comp: string;
  hombres: string;
  mujeres: string;
}

interface RoomData {
  id_habitacion: number;
  habitacion: string;
  camas: string;
  registrados: number;
  ocupados: number;
  libres: number;
}

// Helper function to format company display name
const formatCompanyName = (companyString: string | undefined): string => {
  if (!companyString) return "Sin asignar";

  // Si es "C-1" → "SC"
  if (companyString === "C-1") return "SC";

  // Si es "C0" → "Staff"
  if (companyString === "C0") return "Staff";

  // Si es "C1", "C2", etc. → "Compañía 1", "Compañía 2", etc.
  const match = companyString.match(/^C(\d+)$/);
  if (match) {
    return `Compañía ${match[1]}`;
  }

  // Si no coincide con ningún patrón, devolver tal cual
  return companyString;
};

// Helper function to format company name by ID
const formatCompanyNameById = (companyId: number): string => {
  if (companyId === 1) return "SC";
  if (companyId === 2) return "Staff";
  return `Compañía ${companyId - 2}`;
};

export default function PermutaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"intercambio" | "cambio" | "cambio-compuesto">("intercambio");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [companias, setCompanias] = useState<Compania[]>([]);

  // Estados para Intercambio
  const [persona1, setPersona1] = useState<Participante | null>(null);
  const [persona2, setPersona2] = useState<Participante | null>(null);

  // Estados para Cambio Simple
  const [personaCambio, setPersonaCambio] = useState<Participante | null>(null);
  const [nuevaCompaniaId, setNuevaCompaniaId] = useState<number | null>(null);

  // Estados para Cambio Compuesto
  const [personaCompuesto, setPersonaCompuesto] = useState<Participante | null>(null);
  const [personaCompuestoFull, setPersonaCompuestoFull] = useState<any | null>(null);
  const [companiasCompatibles, setCompaniasCompatibles] = useState<CompanyData[]>([]);
  const [habitacionesCompatibles, setHabitacionesCompatibles] = useState<RoomData[]>([]);
  const [companiaSeleccionada, setCompaniaSeleccionada] = useState<number | null>(null);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<number | null>(null);
  const [marcarAsistencia, setMarcarAsistencia] = useState<boolean>(false);
  const [mostrarBusquedaCompuesto, setMostrarBusquedaCompuesto] = useState(false);
  const [busquedaCompuesto, setBusquedaCompuesto] = useState("");
  const [visibleCountCompuesto, setVisibleCountCompuesto] = useState(20);

  // Estados para búsqueda
  const [mostrarBusquedaPersona1, setMostrarBusquedaPersona1] = useState(false);
  const [mostrarBusquedaPersona2, setMostrarBusquedaPersona2] = useState(false);
  const [mostrarBusquedaCambio, setMostrarBusquedaCambio] = useState(false);
  const [busquedaPersona1, setBusquedaPersona1] = useState("");
  const [busquedaPersona2, setBusquedaPersona2] = useState("");
  const [busquedaCambio, setBusquedaCambio] = useState("");
  const [visibleCount1, setVisibleCount1] = useState(20);
  const [visibleCount2, setVisibleCount2] = useState(20);
  const [visibleCountCambio, setVisibleCountCambio] = useState(20);

  const [showConfirmacion, setShowConfirmacion] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [participantesData, companiasData] = await Promise.all([
          getParticipantes(),
          getCompanias(),
        ]);
        setParticipantes(participantesData);
        setCompanias(companiasData);
      } catch (error) {
        toast.error("Error al cargar datos");
      }
    };

    fetchData();
  }, []);

  // Cerrar paneles de búsqueda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-search-panel]') && !target.closest('button')) {
        setMostrarBusquedaPersona1(false);
        setMostrarBusquedaPersona2(false);
        setMostrarBusquedaCambio(false);
        setMostrarBusquedaCompuesto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pub/Sub para cambio compuesto
  useEffect(() => {
    if (!personaCompuestoFull || mode !== "cambio-compuesto") return;

    const edad = personaCompuestoFull.edad;
    const genero = personaCompuestoFull.sexo;

    const companyChannel = `summary-age-${edad}`;
    const roomChannel = `rooms-age-${edad}-${genero}`;

    // Suscribirse a compañías compatibles
    socket.emit("subscribeToChannel", companyChannel);
    socket.on(companyChannel, (message: any) => {
      try {
        const parsedMessage = typeof message === "string" ? JSON.parse(message) : message;
        const newMessages = Array.isArray(parsedMessage) ? parsedMessage : [parsedMessage];
        const validMessages = newMessages.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.id_comp === "number" &&
            typeof msg.hombres === "string" &&
            typeof msg.mujeres === "string"
        );
        if (validMessages.length > 0) {
          setCompaniasCompatibles([...validMessages]);
        } else {
          setCompaniasCompatibles([]);
        }
      } catch (error) {
        console.error("Error al parsear mensaje de compañías:", error);
      }
    });

    // Suscribirse a habitaciones compatibles
    socket.emit("subscribeToChannel", roomChannel);
    socket.on(roomChannel, (message: any) => {
      try {
        const parsedMessage = typeof message === "string" ? JSON.parse(message) : message;
        const newMessages = Array.isArray(parsedMessage) ? parsedMessage : [parsedMessage];
        const validMessages = newMessages.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.id_habitacion === "number" &&
            typeof msg.habitacion === "string" &&
            typeof msg.camas === "string" &&
            typeof msg.registrados === "number" &&
            typeof msg.ocupados === "number" &&
            typeof msg.libres === "number"
        );
        if (validMessages.length > 0) {
          setHabitacionesCompatibles([...validMessages]);
        } else {
          setHabitacionesCompatibles([]);
        }
      } catch (error) {
        console.error("Error al parsear mensaje de habitaciones:", error);
      }
    });

    // Cleanup
    return () => {
      socket.off(companyChannel);
      socket.off(roomChannel);
    };
  }, [personaCompuestoFull, mode]);

  const handleIntercambio = () => {
    if (!persona1 || !persona2) {
      toast.error("Debes seleccionar dos personas para intercambiar");
      return;
    }

    if (persona1.compania === persona2.compania) {
      toast.error("Las personas están en la misma compañía");
      return;
    }

    setShowConfirmacion(true);
  };

  const handleCambioSimple = () => {
    if (!personaCambio) {
      toast.error("Debes seleccionar una persona");
      return;
    }

    if (!nuevaCompaniaId) {
      toast.error("Debes seleccionar la nueva compañía");
      return;
    }

    const nuevaCompania = companias.find(c => c.id_comp === nuevaCompaniaId);
    if (personaCambio.compania === nuevaCompania?.comp) {
      toast.error("La persona ya está en esa compañía");
      return;
    }

    setShowConfirmacion(true);
  };

  const handleCambioCompuesto = () => {
    if (!personaCompuesto) {
      toast.error("Debes seleccionar una persona");
      return;
    }

    if (!companiaSeleccionada) {
      toast.error("Debes seleccionar la nueva compañía");
      return;
    }

    if (habitacionSeleccionada === null) {
      toast.error("Debes seleccionar la nueva habitación");
      return;
    }

    setShowConfirmacion(true);
  };

  const confirmarAccion = async () => {
    try {
      if (mode === "intercambio") {
        if (!persona1 || !persona2) return;

        // Llamar al endpoint de intercambio
        const resultado = await intercambiarParticipantes(
          persona1.id,
          persona2.id
        );

        toast.success(resultado.mensaje || "Intercambio realizado exitosamente");
        console.log("Resultado del intercambio:", resultado);

        // Reset y recargar participantes
        setPersona1(null);
        setPersona2(null);

        // Recargar la lista de participantes
        const data = await getParticipantes();
        setParticipantes(data);
      } else if (mode === "cambio") {
        if (!personaCambio || !nuevaCompaniaId) return;

        // Llamar al endpoint de cambio
        const resultado = await cambiarCompaniaAPI(
          personaCambio.id,
          nuevaCompaniaId
        );

        toast.success(resultado.mensaje || "Cambio realizado exitosamente");
        console.log("Resultado del cambio:", resultado);

        // Reset y recargar participantes
        setPersonaCambio(null);
        setNuevaCompaniaId(null);

        // Recargar la lista de participantes
        const data = await getParticipantes();
        setParticipantes(data);
      } else if (mode === "cambio-compuesto") {
        if (!personaCompuesto || !companiaSeleccionada || habitacionSeleccionada === null) return;

        // Llamar al endpoint de cambio compuesto
        const resultado = await cambioCompuestoAPI(
          personaCompuesto.id,
          companiaSeleccionada,
          habitacionSeleccionada,
          marcarAsistencia
        );

        toast.success(resultado.mensaje || "Cambio compuesto realizado exitosamente");
        console.log("Resultado del cambio compuesto:", resultado);

        // Reset y recargar participantes
        setPersonaCompuesto(null);
        setPersonaCompuestoFull(null);
        setCompaniaSeleccionada(null);
        setHabitacionSeleccionada(null);
        setMarcarAsistencia(false);
        setCompaniasCompatibles([]);
        setHabitacionesCompatibles([]);

        // Recargar la lista de participantes
        const data = await getParticipantes();
        setParticipantes(data);
      }

      setShowConfirmacion(false);
    } catch (error: any) {
      console.error("Error al realizar la acción:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error al realizar la operación"
      );
      setShowConfirmacion(false);
    }
  };

  const resetIntercambio = () => {
    setPersona1(null);
    setPersona2(null);
  };

  const resetCambio = () => {
    setPersonaCambio(null);
    setNuevaCompaniaId(null);
  };

  const resetCambioCompuesto = () => {
    setPersonaCompuesto(null);
    setPersonaCompuestoFull(null);
    setCompaniaSeleccionada(null);
    setHabitacionSeleccionada(null);
    setMarcarAsistencia(false);
    setCompaniasCompatibles([]);
    setHabitacionesCompatibles([]);
  };

  // Funciones de filtrado
  const participantesFiltrados1 = participantes.filter((p) =>
    p.name.toLowerCase().includes(busquedaPersona1.toLowerCase())
  );

  const participantesFiltrados2 = participantes.filter((p) =>
    p.name.toLowerCase().includes(busquedaPersona2.toLowerCase())
  );

  const participantesFiltradosCambio = participantes.filter((p) =>
    p.name.toLowerCase().includes(busquedaCambio.toLowerCase())
  );

  const participantesFiltradosCompuesto = participantes.filter((p) =>
    p.name.toLowerCase().includes(busquedaCompuesto.toLowerCase())
  );

  // Funciones de selección
  const seleccionarPersona1 = (participante: Participante) => {
    setPersona1(participante);
    setMostrarBusquedaPersona1(false);
    setBusquedaPersona1("");
    setVisibleCount1(20);
  };

  const seleccionarPersona2 = (participante: Participante) => {
    setPersona2(participante);
    setMostrarBusquedaPersona2(false);
    setBusquedaPersona2("");
    setVisibleCount2(20);
  };

  const seleccionarPersonaCambio = (participante: Participante) => {
    setPersonaCambio(participante);
    setMostrarBusquedaCambio(false);
    setBusquedaCambio("");
    setVisibleCountCambio(20);
  };

  const seleccionarPersonaCompuesto = async (participante: Participante) => {
    try {
      setPersonaCompuesto(participante);
      setMostrarBusquedaCompuesto(false);
      setBusquedaCompuesto("");
      setVisibleCountCompuesto(20);

      // Obtener datos completos del participante
      const datosCompletos = await buscarParticipanteCompleto(participante.id);
      setPersonaCompuestoFull(datosCompletos);
    } catch (error) {
      console.error("Error al buscar datos completos del participante:", error);
      toast.error("Error al obtener datos del participante");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg p-4">
        <div className="container mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Gestión de Permutas
            </h1>
            <p className="text-blue-100 text-sm">
              Intercambia o mueve participantes entre compañías
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 max-w-4xl">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "intercambio" | "cambio" | "cambio-compuesto")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="intercambio" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Intercambio</span>
              <span className="sm:hidden">Inter.</span>
            </TabsTrigger>
            <TabsTrigger value="cambio" className="flex items-center gap-2">
              <MoveRight className="h-4 w-4" />
              <span className="hidden sm:inline">Cambio Simple</span>
              <span className="sm:hidden">Simple</span>
            </TabsTrigger>
            <TabsTrigger value="cambio-compuesto" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Cambio Compuesto</span>
              <span className="sm:hidden">Comp.</span>
            </TabsTrigger>
          </TabsList>

          {/* MODO INTERCAMBIO */}
          <TabsContent value="intercambio">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                  Intercambio de Participantes
                </CardTitle>
                <CardDescription>
                  Selecciona dos personas de diferentes compañías para
                  intercambiarlas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Persona 1 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Persona 1
                  </label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left bg-white hover:bg-slate-50"
                      onClick={() => setMostrarBusquedaPersona1(true)}
                    >
                      <Search className="h-4 w-4 mr-2 opacity-50" />
                      {persona1 ? persona1.name : "Buscar primer participante..."}
                    </Button>

                    {mostrarBusquedaPersona1 && (
                      <Card data-search-panel className="absolute top-full left-0 right-0 mt-1 z-10 shadow-lg">
                        <CardHeader className="py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar por nombre..."
                              className="pl-8"
                              value={busquedaPersona1}
                              onChange={(e) => setBusquedaPersona1(e.target.value)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-64 overflow-y-auto py-2">
                          {participantesFiltrados1.length > 0 ? (
                            <>
                              <div className="space-y-1">
                                {participantesFiltrados1
                                  .slice(0, visibleCount1)
                                  .map((participante) => (
                                    <div
                                      key={participante.id}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                      onClick={() => seleccionarPersona1(participante)}
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {participante.name}
                                        </p>
                                        <div className="flex items-center text-sm text-slate-500">
                                          <span>
                                            Compañía:{" "}
                                            {participante.compania || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <Check className="h-5 w-5 text-blue-600" />
                                    </div>
                                  ))}
                              </div>
                              {visibleCount1 < participantesFiltrados1.length && (
                                <Button
                                  variant="link"
                                  className="w-full mt-2"
                                  onClick={() => setVisibleCount1((prev) => prev + 20)}
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

                  {persona1 && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold text-slate-800 text-base hover:text-blue-600"
                              onClick={() => router.push(`/registro/${persona1.id}`)}
                            >
                              {persona1.name}
                            </Button>
                            <div className="text-sm text-slate-600">
                              Compañía actual:{" "}
                              <Badge variant="secondary">
                                {persona1.compania || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPersona1(null)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Flecha visual */}
                <div className="flex justify-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {/* Persona 2 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Persona 2
                  </label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left bg-white hover:bg-slate-50"
                      onClick={() => setMostrarBusquedaPersona2(true)}
                    >
                      <Search className="h-4 w-4 mr-2 opacity-50" />
                      {persona2 ? persona2.name : "Buscar segundo participante..."}
                    </Button>

                    {mostrarBusquedaPersona2 && (
                      <Card data-search-panel className="absolute top-full left-0 right-0 mt-1 z-10 shadow-lg">
                        <CardHeader className="py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar por nombre..."
                              className="pl-8"
                              value={busquedaPersona2}
                              onChange={(e) => setBusquedaPersona2(e.target.value)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-64 overflow-y-auto py-2">
                          {participantesFiltrados2.length > 0 ? (
                            <>
                              <div className="space-y-1">
                                {participantesFiltrados2
                                  .slice(0, visibleCount2)
                                  .map((participante) => (
                                    <div
                                      key={participante.id}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                      onClick={() => seleccionarPersona2(participante)}
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {participante.name}
                                        </p>
                                        <div className="flex items-center text-sm text-slate-500">
                                          <span>
                                            Compañía:{" "}
                                            {participante.compania || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <Check className="h-5 w-5 text-green-600" />
                                    </div>
                                  ))}
                              </div>
                              {visibleCount2 < participantesFiltrados2.length && (
                                <Button
                                  variant="link"
                                  className="w-full mt-2"
                                  onClick={() => setVisibleCount2((prev) => prev + 20)}
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

                  {persona2 && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold text-slate-800 text-base hover:text-green-600"
                              onClick={() => router.push(`/registro/${persona2.id}`)}
                            >
                              {persona2.name}
                            </Button>
                            <div className="text-sm text-slate-600">
                              Compañía actual:{" "}
                              <Badge variant="secondary">
                                {persona2.compania || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPersona2(null)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Vista previa del resultado */}
                {persona1 && persona2 && (
                  <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      Vista previa del intercambio:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MoveRight className="h-4 w-4 text-blue-600" />
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-sm hover:text-blue-600"
                          onClick={() => router.push(`/registro/${persona1.id}`)}
                        >
                          {persona1.name}
                        </Button>
                        <span className="text-slate-600">
                          {persona1.compania} → {persona2.compania}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MoveRight className="h-4 w-4 text-green-600" />
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-sm hover:text-green-600"
                          onClick={() => router.push(`/registro/${persona2.id}`)}
                        >
                          {persona2.name}
                        </Button>
                        <span className="text-slate-600">
                          {persona2.compania} → {persona1.compania}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto sm:flex-1"
                    onClick={resetIntercambio}
                    disabled={!persona1 && !persona2}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button
                    className="w-full sm:w-auto sm:flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleIntercambio}
                    disabled={!persona1 || !persona2}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Realizar Intercambio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODO CAMBIO SIMPLE */}
          <TabsContent value="cambio">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MoveRight className="h-5 w-5 text-blue-600" />
                  Cambio de Compañía
                </CardTitle>
                <CardDescription>
                  Mueve un participante de una compañía a otra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Persona a cambiar */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Participante
                  </label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left bg-white hover:bg-slate-50"
                      onClick={() => setMostrarBusquedaCambio(true)}
                    >
                      <Search className="h-4 w-4 mr-2 opacity-50" />
                      {personaCambio ? personaCambio.name : "Buscar participante..."}
                    </Button>

                    {mostrarBusquedaCambio && (
                      <Card data-search-panel className="absolute top-full left-0 right-0 mt-1 z-10 shadow-lg">
                        <CardHeader className="py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar por nombre..."
                              className="pl-8"
                              value={busquedaCambio}
                              onChange={(e) => setBusquedaCambio(e.target.value)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-64 overflow-y-auto py-2">
                          {participantesFiltradosCambio.length > 0 ? (
                            <>
                              <div className="space-y-1">
                                {participantesFiltradosCambio
                                  .slice(0, visibleCountCambio)
                                  .map((participante) => (
                                    <div
                                      key={participante.id}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 cursor-pointer"
                                      onClick={() => seleccionarPersonaCambio(participante)}
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {participante.name}
                                        </p>
                                        <div className="flex items-center text-sm text-slate-500">
                                          <span>
                                            Compañía:{" "}
                                            {participante.compania || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <Check className="h-5 w-5 text-blue-600" />
                                    </div>
                                  ))}
                              </div>
                              {visibleCountCambio < participantesFiltradosCambio.length && (
                                <Button
                                  variant="link"
                                  className="w-full mt-2"
                                  onClick={() => setVisibleCountCambio((prev) => prev + 20)}
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

                  {personaCambio && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold text-slate-800 text-base hover:text-blue-600"
                              onClick={() => router.push(`/registro/${personaCambio.id}`)}
                            >
                              {personaCambio.name}
                            </Button>
                            <div className="text-sm text-slate-600">
                              Compañía actual:{" "}
                              <Badge variant="secondary">
                                {personaCambio.compania || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPersonaCambio(null)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Flecha visual */}
                <div className="flex justify-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MoveRight className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {/* Nueva Compañía */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Nueva Compañía
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                    {companias
                      .filter((compania) => compania.id_comp !== 1 && compania.id_comp !== 2)
                      .map((compania) => (
                        <Button
                          key={compania.id_comp}
                          variant={nuevaCompaniaId === compania.id_comp ? "default" : "outline"}
                          className={`h-12 ${
                            nuevaCompaniaId === compania.id_comp
                              ? "bg-blue-600 hover:bg-blue-700"
                              : ""
                          }`}
                          onClick={() => setNuevaCompaniaId(compania.id_comp)}
                          title={`C${compania.id_comp - 2}`}
                        >
                          {compania.id_comp - 2}
                        </Button>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Vista previa del resultado */}
                {personaCambio && nuevaCompaniaId && (
                  <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      Vista previa del cambio:
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <MoveRight className="h-4 w-4 text-blue-600" />
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-sm hover:text-blue-600"
                        onClick={() => router.push(`/registro/${personaCambio.id}`)}
                      >
                        {personaCambio.name}
                      </Button>
                      <span className="text-slate-600">
                        {personaCambio.compania} → {nuevaCompaniaId ? `C${nuevaCompaniaId - 2}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto sm:flex-1"
                    onClick={resetCambio}
                    disabled={!personaCambio && !nuevaCompaniaId}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button
                    className="w-full sm:w-auto sm:flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleCambioSimple}
                    disabled={!personaCambio || !nuevaCompaniaId}
                  >
                    <MoveRight className="h-4 w-4 mr-2" />
                    Realizar Cambio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODO CAMBIO COMPUESTO */}
          <TabsContent value="cambio-compuesto">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Cambio Compuesto
                </CardTitle>
                <CardDescription>
                  Cambia compañía y habitación de un participante según compatibilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selección de Participante */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Participante
                  </label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left bg-white hover:bg-slate-50"
                      onClick={() => setMostrarBusquedaCompuesto(!mostrarBusquedaCompuesto)}
                    >
                      {personaCompuesto ? (
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{personaCompuesto.name}</div>
                            <div className="text-xs text-slate-500">
                              Compañía: {formatCompanyName(personaCompuesto.compania)}
                            </div>
                          </div>
                          <Badge className="ml-2">{personaCompuesto.id}</Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Buscar participante...
                        </span>
                      )}
                    </Button>

                    {/* Panel de búsqueda */}
                    {mostrarBusquedaCompuesto && (
                      <div
                        data-search-panel
                        className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg"
                      >
                        <div className="p-3">
                          <Input
                            placeholder="Buscar por nombre..."
                            value={busquedaCompuesto}
                            onChange={(e) => setBusquedaCompuesto(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {participantesFiltradosCompuesto
                              .slice(0, visibleCountCompuesto)
                              .map((p) => (
                                <button
                                  key={p.id}
                                  className="w-full text-left p-2 hover:bg-slate-100 rounded flex justify-between items-center"
                                  onClick={() => seleccionarPersonaCompuesto(p)}
                                >
                                  <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-slate-500">
                                      {p.compania || "Sin asignar"}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{p.id}</Badge>
                                </button>
                              ))}
                          </div>
                          {participantesFiltradosCompuesto.length >
                            visibleCountCompuesto && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() =>
                                setVisibleCountCompuesto((prev) => prev + 20)
                              }
                            >
                              Cargar más...
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nueva Compañía */}
                {personaCompuestoFull && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Nueva Compañía (Compatibles: Edad {personaCompuestoFull.edad})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {companiasCompatibles.length > 0 ? (
                        companiasCompatibles
                          .filter((comp) => comp.id_comp !== 1 && comp.id_comp !== 2)
                          .map((comp) => (
                            <Button
                              key={comp.id_comp}
                              variant={
                                companiaSeleccionada === comp.id_comp
                                  ? "default"
                                  : "outline"
                              }
                              className="h-auto py-3"
                              onClick={() => setCompaniaSeleccionada(comp.id_comp)}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium">C{comp.id_comp - 2}</span>
                                <span className="text-xs">
                                  H: {comp.hombres} | M: {comp.mujeres}
                                </span>
                              </div>
                            </Button>
                          ))
                      ) : (
                        <div className="col-span-full text-center text-sm text-slate-500 py-4">
                          Cargando compañías compatibles...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nueva Habitación */}
                {personaCompuestoFull && companiaSeleccionada && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Nueva Habitación (Sexo: {personaCompuestoFull.sexo})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Opción especial: Sin Habitación (id_habitacion = 1) */}
                      <Button
                        variant={
                          habitacionSeleccionada === 1
                            ? "default"
                            : "outline"
                        }
                        className="h-auto py-3 border-dashed border-2"
                        onClick={() => setHabitacionSeleccionada(1)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">Sin Habitación</span>
                          <span className="text-xs text-slate-500">
                            Asignar sin habitación
                          </span>
                        </div>
                      </Button>

                      {/* Habitaciones compatibles (excluyendo la id=1 que ya se muestra arriba) */}
                      {habitacionesCompatibles.length > 0 ? (
                        habitacionesCompatibles
                          .filter((hab) => hab.id_habitacion !== 1)
                          .map((hab) => (
                            <Button
                              key={hab.id_habitacion}
                              variant={
                                habitacionSeleccionada === hab.id_habitacion
                                  ? "default"
                                  : "outline"
                              }
                              className="h-auto py-3"
                              onClick={() => setHabitacionSeleccionada(hab.id_habitacion)}
                              disabled={hab.libres === 0}
                            >
                              <div className="flex flex-col items-start w-full">
                                <span className="font-medium">{hab.habitacion}</span>
                                <span className="text-xs">
                                  Camas: {hab.camas} | Libres: {hab.libres}
                                </span>
                              </div>
                            </Button>
                          ))
                      ) : (
                        <div className="col-span-full text-center text-sm text-slate-500 py-4">
                          Cargando habitaciones compatibles...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Checkbox para marcar asistencia */}
                {personaCompuestoFull && companiaSeleccionada && habitacionSeleccionada !== null && (
                  <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <Checkbox
                      id="marcar-asistencia"
                      checked={marcarAsistencia}
                      onCheckedChange={(checked) => setMarcarAsistencia(checked as boolean)}
                    />
                    <label
                      htmlFor="marcar-asistencia"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Marcar asistencia al realizar el cambio
                    </label>
                  </div>
                )}

                {/* Vista Previa */}
                {personaCompuesto && companiaSeleccionada && habitacionSeleccionada !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Vista Previa del Cambio
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{personaCompuesto.name}</span>
                        <Badge>{personaCompuesto.id}</Badge>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-slate-500">Compañía Actual</div>
                          <div className="font-medium">{formatCompanyName(personaCompuesto.compania)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Nueva Compañía</div>
                          <div className="font-medium text-green-600">
                            {companiaSeleccionada ? formatCompanyNameById(companiaSeleccionada) : ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Habitación Actual</div>
                          <div className="font-medium">{personaCompuestoFull?.habitacion || "Sin asignar"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Nueva Habitación</div>
                          <div className="font-medium text-green-600">
                            {habitacionSeleccionada === 1
                              ? "Sin Habitación"
                              : habitacionesCompatibles.find(h => h.id_habitacion === habitacionSeleccionada)?.habitacion}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Asistencia Actual</div>
                          <div className="font-medium">{personaCompuestoFull?.asistio || "No"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Nueva Asistencia</div>
                          <div className={`font-medium ${marcarAsistencia ? 'text-green-600' : 'text-slate-600'}`}>
                            {marcarAsistencia ? "Sí" : "Sin cambios"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto sm:flex-1"
                    onClick={resetCambioCompuesto}
                    disabled={!personaCompuesto}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button
                    className="w-full sm:w-auto sm:flex-1 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                    onClick={handleCambioCompuesto}
                    disabled={!personaCompuesto || !companiaSeleccionada || habitacionSeleccionada === null}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Realizar Cambio Compuesto</span>
                    <span className="sm:hidden">Realizar Cambio</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={showConfirmacion} onOpenChange={setShowConfirmacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {mode === "intercambio" ? (
                <div className="space-y-2">
                  <div>¿Estás seguro de realizar este intercambio?</div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                    <div>
                      <strong>{persona1?.name}</strong>: {persona1?.compania} →{" "}
                      {persona2?.compania}
                    </div>
                    <div>
                      <strong>{persona2?.name}</strong>: {persona2?.compania} →{" "}
                      {persona1?.compania}
                    </div>
                  </div>
                </div>
              ) : mode === "cambio" ? (
                <div className="space-y-2">
                  <div>¿Estás seguro de realizar este cambio?</div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm">
                    <div>
                      <strong>{personaCambio?.name}</strong>:{" "}
                      {personaCambio?.compania} → {nuevaCompaniaId ? `C${nuevaCompaniaId - 2}` : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>¿Estás seguro de realizar este cambio compuesto?</div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
                    <div>
                      <strong>{personaCompuesto?.name}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Compañía:</div>
                        <div>{formatCompanyName(personaCompuesto?.compania)} → {companiaSeleccionada ? formatCompanyNameById(companiaSeleccionada) : ''}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Habitación:</div>
                        <div>{personaCompuestoFull?.habitacion} → {habitacionSeleccionada === 1 ? "Sin Habitación" : habitacionesCompatibles.find(h => h.id_habitacion === habitacionSeleccionada)?.habitacion}</div>
                      </div>
                      {marcarAsistencia && (
                        <div className="col-span-2">
                          <div className="text-slate-500">Asistencia:</div>
                          <div className="text-green-600 font-semibold">✓ Se marcará asistencia</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarAccion}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
