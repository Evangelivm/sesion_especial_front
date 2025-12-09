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
} from "@/lib/connections";
import { toast } from "sonner";

interface Participante {
  id: number;
  name: string;
  compania?: string;
}

interface Compania {
  id_comp: number;
  comp: string;
}


export default function PermutaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"intercambio" | "cambio">("intercambio");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [companias, setCompanias] = useState<Compania[]>([]);

  // Estados para Intercambio
  const [persona1, setPersona1] = useState<Participante | null>(null);
  const [persona2, setPersona2] = useState<Participante | null>(null);

  // Estados para Cambio Simple
  const [personaCambio, setPersonaCambio] = useState<Participante | null>(null);
  const [nuevaCompaniaId, setNuevaCompaniaId] = useState<number | null>(null);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      } else {
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
          onValueChange={(v) => setMode(v as "intercambio" | "cambio")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="intercambio" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Intercambio
            </TabsTrigger>
            <TabsTrigger value="cambio" className="flex items-center gap-2">
              <MoveRight className="h-4 w-4" />
              Cambio Simple
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
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetIntercambio}
                    disabled={!persona1 && !persona2}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
                    {companias.map((compania) => (
                      <Button
                        key={compania.id_comp}
                        variant={nuevaCompaniaId === compania.id_comp ? "default" : "outline"}
                        className={`h-12 ${
                          nuevaCompaniaId === compania.id_comp
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={() => setNuevaCompaniaId(compania.id_comp)}
                        title={compania.comp}
                      >
                        {compania.comp.replace('C', '')}
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
                        {personaCambio.compania} → {companias.find(c => c.id_comp === nuevaCompaniaId)?.comp}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetCambio}
                    disabled={!personaCambio && !nuevaCompaniaId}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
              ) : (
                <div className="space-y-2">
                  <div>¿Estás seguro de realizar este cambio?</div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm">
                    <div>
                      <strong>{personaCambio?.name}</strong>:{" "}
                      {personaCambio?.compania} → {companias.find(c => c.id_comp === nuevaCompaniaId)?.comp}
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
