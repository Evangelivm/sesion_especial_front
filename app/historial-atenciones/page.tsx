"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import {
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  FileText,
  ChevronRight,
  X,
  ArrowUpDown,
  Send,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useMobile } from "@/hooks/use-mobile";
import RadialMenu from "@/components/radial-menu";
import { getHistorialAtenciones, getParticipantes } from "@/lib/connections";
// Tipos de datos
interface MedicamentoRecetado {
  frecuencia: string;
  duracion: string;
  inventario_salud: {
    nombre: string;
    descripcion: string;
    dosis: string | null;
  };
}
interface AtencionMedica {
  id_salud: number;
  fecha_consulta: string;
  motivo_consulta: string;
  tratamiento: string;
  seguimiento: number; // 0 o 1
  fecha_seguimiento: string | null;
  datos: {
    id: number;
    nombre_completo: string;
  };
  medicinas_recetadas: MedicamentoRecetado[];
}
interface Participante {
  id: number;
  name: string;
}
export default function HistorialAtencionesPage() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroFechaSeguimiento, setFiltroFechaSeguimiento] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("fecha-desc");
  const [atencionSeleccionada, setAtencionSeleccionada] =
    useState<AtencionMedica | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [atencionesOriginales, setAtencionesOriginales] = useState<
    AtencionMedica[]
  >([]);
  const [atencionesFiltradas, setAtencionesFiltradas] = useState<
    AtencionMedica[]
  >([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isMobile = useMobile();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const historial = await getHistorialAtenciones();
        const parts = await getParticipantes();
        setAtencionesOriginales(historial);
        setParticipantes(parts);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);
  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let resultado = [...atencionesOriginales];
    // Filtro por búsqueda (nombre del participante o motivo de consulta)
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(
        (a) =>
          a.datos.nombre_completo.toLowerCase().includes(busquedaLower) ||
          a.motivo_consulta.toLowerCase().includes(busquedaLower)
      );
    }
    // Filtro por fecha de consulta
    if (filtroFecha) {
      resultado = resultado.filter((a) =>
        a.fecha_consulta.startsWith(filtroFecha)
      );
    }
    // Filtro por fecha de seguimiento
    if (filtroFechaSeguimiento) {
      resultado = resultado.filter(
        (a) =>
          a.seguimiento === 1 &&
          a.fecha_seguimiento &&
          a.fecha_seguimiento.startsWith(filtroFechaSeguimiento)
      );
    }
    // Ordenamiento
    switch (ordenarPor) {
      case "fecha-desc":
        resultado.sort((a, b) => {
          const dateA = new Date(a.fecha_consulta).getTime();
          const dateB = new Date(b.fecha_consulta).getTime();
          return dateB - dateA;
        });
        break;
      case "fecha-asc":
        resultado.sort((a, b) => {
          const dateA = new Date(a.fecha_consulta).getTime();
          const dateB = new Date(b.fecha_consulta).getTime();
          return dateA - dateB;
        });
        break;
      case "nombre-asc":
        resultado.sort((a, b) =>
          a.datos.nombre_completo.localeCompare(b.datos.nombre_completo)
        );
        break;
      case "nombre-desc":
        resultado.sort((a, b) =>
          b.datos.nombre_completo.localeCompare(a.datos.nombre_completo)
        );
        break;
      case "seguimiento-desc":
        resultado.sort((a, b) => {
          const dateA = a.fecha_seguimiento
            ? new Date(a.fecha_seguimiento).getTime()
            : 0;
          const dateB = b.fecha_seguimiento
            ? new Date(b.fecha_seguimiento).getTime()
            : 0;
          return dateB - dateA;
        });
        break;
      case "seguimiento-asc":
        resultado.sort((a, b) => {
          const dateA = a.fecha_seguimiento
            ? new Date(a.fecha_seguimiento).getTime()
            : 0;
          const dateB = b.fecha_seguimiento
            ? new Date(b.fecha_seguimiento).getTime()
            : 0;
          return dateA - dateB;
        });
        break;
    }
    setAtencionesFiltradas(resultado);
  }, [
    busqueda,
    filtroFecha,
    filtroFechaSeguimiento,
    ordenarPor,
    atencionesOriginales,
    participantes,
  ]);

  dayjs.extend(utc);
  dayjs.extend(localizedFormat);

  // Formatear fecha y hora
  const formatearFecha = (isoString: string) => {
    return dayjs.utc(isoString).local().format("DD/MM/YYYY");
  };
  const formatearHora = (isoString: string) => {
    return dayjs.utc(isoString).local().format("HH:mm");
  };
  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroFecha("");
    setFiltroFechaSeguimiento("");
    setOrdenarPor("fecha-desc");
    setMostrarFiltros(false);
  };
  // Ver detalles de una atención
  const verDetalles = (atencion: AtencionMedica) => {
    setAtencionSeleccionada(atencion);
    setMostrarDetalles(true);
  };
  // Ir a nueva atención
  const nuevaAtencion = () => {
    router.push("/atencion-medica");
  };
  // Ir al registro del participante
  const irARegistro = (id: number) => {
    router.push(`/registro/${id}`);
  };
  // Radial menu handlers
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setShowMenu(false);
    if (option === "registration") {
      nuevaAtencion();
    }
  };
  const handleMobileMenuOpen = () => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    setShowMenu(true);
  };
  // Radial menu options
  const menuOptions = [
    { id: "companies", label: "Compañía", icon: "Users" },
    { id: "person", label: "Persona", icon: "User" },
    { id: "health", label: "Salud", icon: "FirstAid" },
    { id: "registration", label: "Inscripción", icon: "ClipboardList" },
    { id: "attendance", label: "Asistencia", icon: "CalendarCheck" },
    { id: "statistics", label: "Stats", icon: "BarChart2" },
    { id: "inventory", label: "Inventario", icon: "Package" },
  ];
  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-50 pb-10"
      onContextMenu={!isMobile ? handleRightClick : undefined}
    >
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center">
        <button onClick={() => router.push("/")} className="text-white mr-2">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-white mr-auto">
          Historial de Atenciones
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={nuevaAtencion}>
            Nueva Atención
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/inventario-medicamentos")}
          >
            Inventario
          </Button>
        </div>
      </div>
      {/* Barra de búsqueda y filtros */}
      <div className="container max-w-7xl px-4 mt-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o motivo..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Sheet open={mostrarFiltros} onOpenChange={setMostrarFiltros}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Filtra las atenciones médicas por diferentes criterios
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha de Seguimiento
                  </label>
                  <Input
                    type="date"
                    value={filtroFechaSeguimiento}
                    onChange={(e) => setFiltroFechaSeguimiento(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fecha-desc">
                        Fecha (más reciente)
                      </SelectItem>
                      <SelectItem value="fecha-asc">
                        Fecha (más antigua)
                      </SelectItem>
                      <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
                      <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
                      <SelectItem value="seguimiento-desc">
                        Fecha Seguimiento (más reciente)
                      </SelectItem>
                      <SelectItem value="seguimiento-asc">
                        Fecha Seguimiento (más antigua)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                  <Button onClick={() => setMostrarFiltros(false)}>
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Resumen de filtros aplicados */}
        {(filtroFecha || filtroFechaSeguimiento) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filtroFecha && (
              <Badge variant="secondary" className="pl-2 pr-1 py-1">
                Fecha Consulta: {formatearFecha(filtroFecha)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setFiltroFecha("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filtroFechaSeguimiento && (
              <Badge variant="secondary" className="pl-2 pr-1 py-1">
                Fecha Seguimiento: {formatearFecha(filtroFechaSeguimiento)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setFiltroFechaSeguimiento("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
        {/* Ordenamiento visible */}
        <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
          <span>{atencionesFiltradas.length} atenciones</span>
          <div className="flex items-center">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <Select value={ordenarPor} onValueChange={setOrdenarPor}>
              <SelectTrigger className="h-8 text-xs border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha-desc">Fecha (más reciente)</SelectItem>
                <SelectItem value="fecha-asc">Fecha (más antigua)</SelectItem>
                <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="seguimiento-desc">
                  Fecha Seguimiento (más reciente)
                </SelectItem>
                <SelectItem value="seguimiento-asc">
                  Fecha Seguimiento (más antigua)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Lista de atenciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atencionesFiltradas.length > 0 ? (
            atencionesFiltradas.map((atencion) => (
              <Card
                key={atencion.id_salud} // Cambiado a id_salud
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => verDetalles(atencion)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-slate-500 mr-1" />
                        <span className="text-sm text-slate-500">
                          {formatearFecha(atencion.fecha_consulta)} •{" "}
                          {formatearHora(atencion.fecha_consulta)}
                        </span>
                      </div>
                      <h3 className="font-medium mt-1">
                        {atencion.datos.nombre_completo}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {atencion.motivo_consulta}
                      </p>
                      {/* Mostrar fecha de seguimiento en el card si existe */}
                      {atencion.seguimiento === 1 &&
                        atencion.fecha_seguimiento && (
                          <div className="flex items-center mt-2 text-sm text-slate-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              Seguimiento:{" "}
                              {formatearFecha(atencion.fecha_seguimiento)} •{" "}
                              {formatearHora(atencion.fecha_seguimiento)}
                            </span>
                          </div>
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 col-span-full">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-2" />
              <p>No se encontraron atenciones médicas</p>
              <p className="text-sm mt-1">
                Intenta con otros filtros o crea una nueva atención
              </p>
            </div>
          )}
        </div>
        {/* Botón flotante para móviles (Radial Menu) */}
        {isMobile && (
          <button
            onClick={handleMobileMenuOpen}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-700 shadow-lg flex items-center justify-center z-20 hover:bg-slate-600 transition-colors"
            aria-label="Abrir menú"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        )}
        {/* Radial Menu */}
        {showMenu && (
          <RadialMenu
            options={menuOptions}
            position={position}
            onSelect={handleOptionSelect}
            onClose={() => setShowMenu(false)}
            isMobile={isMobile}
          />
        )}
      </div>
      {/* Panel flotante de detalles de atención */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles de Atención Médica</DialogTitle>
            <DialogDescription>
              Información completa de la atención registrada.
            </DialogDescription>
          </DialogHeader>
          {atencionSeleccionada && (
            <div className="space-y-4 py-4 text-sm">
              <div>
                <strong>Participante:</strong>{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-left"
                  onClick={() => irARegistro(atencionSeleccionada.datos.id)}
                >
                  {atencionSeleccionada.datos.nombre_completo}
                </Button>
              </div>
              <p>
                <strong>Fecha de Consulta:</strong>{" "}
                {formatearFecha(atencionSeleccionada.fecha_consulta)} a las{" "}
                {formatearHora(atencionSeleccionada.fecha_consulta)}
              </p>
              <p>
                <strong>Motivo de Consulta:</strong>{" "}
                {atencionSeleccionada.motivo_consulta}
              </p>
              <p>
                <strong>Tratamiento:</strong> {atencionSeleccionada.tratamiento}
              </p>
              <p>
                <strong>Seguimiento:</strong>{" "}
                {atencionSeleccionada.seguimiento === 1 ? `Sí` : "No"}
              </p>
              {/* Mostrar fecha de seguimiento en el dialog si existe */}
              {atencionSeleccionada.seguimiento === 1 &&
                atencionSeleccionada.fecha_seguimiento && (
                  <p>
                    <strong>Fecha de Seguimiento:</strong>{" "}
                    {formatearFecha(atencionSeleccionada.fecha_seguimiento)} a
                    las {formatearHora(atencionSeleccionada.fecha_seguimiento)}
                  </p>
                )}
              {atencionSeleccionada.medicinas_recetadas.length > 0 && (
                <div>
                  <p className="font-medium mt-2">Medicamentos Recetados:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {atencionSeleccionada.medicinas_recetadas.map(
                      (med, index) => (
                        <li key={index}>
                          {med.inventario_salud.nombre}
                          {med.inventario_salud.dosis &&
                            ` - ${med.inventario_salud.dosis}`}
                          {(med.frecuencia || med.duracion) && " ("}
                          {med.frecuencia && (
                            <>
                              <b>Frecuencia:</b> {med.frecuencia}
                              {med.duracion && ", "}
                            </>
                          )}
                          {med.duracion && (
                            <>
                              <b>Duración:</b> {med.duracion}
                            </>
                          )}
                          {(med.frecuencia || med.duracion) && ")"}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
