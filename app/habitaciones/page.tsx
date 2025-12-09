"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Bed, User, Search, X } from "lucide-react";
import { getHabitaciones } from "@/lib/connections";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation";

// Estilos para la animación parpadeante
const pulseAnimation = `
  @keyframes pulse-highlight {
    0%, 100% {
      background-color: rgba(245, 169, 98, 0.4);
      border-color: #F5A962;
      transform: scale(1);
    }
    50% {
      background-color: rgba(245, 169, 98, 0.8);
      border-color: #F5A962;
      transform: scale(1.02);
    }
  }
`;

type Ocupante = {
  id: number;
  nombre: string;
  edad: number;
  compania: string;
  tipo: string;
};

type Habitacion = {
  id_habitacion: number;
  habitacion: string;
  sexo: "H" | "M";
  camas: number;
  ocupados: number;
  libres: number;
  ocupantes: Ocupante[];
};

export default function HabitacionesPage() {
  const router = useRouter();
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [filtroGenero, setFiltroGenero] = useState<"Todas" | "H" | "M">(
    "Todas"
  );
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [habitacionAbierta, setHabitacionAbierta] = useState<string>("");
  const [ocupanteResaltado, setOcupanteResaltado] = useState<number | null>(null);

  useEffect(() => {
    const fetchHabitaciones = async () => {
      try {
        const data = await getHabitaciones();
        setHabitaciones(data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener habitaciones:", error);
        setLoading(false);
      }
    };

    fetchHabitaciones();

    // Suscribirse a actualizaciones en tiempo real
    socket.emit("subscribeToChannel", "habitaciones-updates");

    socket.on("habitaciones-updates", (message: any) => {
      try {
        const parsedMessage =
          typeof message === "string" ? JSON.parse(message) : message;
        setHabitaciones(parsedMessage);
      } catch (error) {
        console.error("Error al parsear mensaje de habitaciones:", error);
      }
    });

    return () => {
      socket.off("habitaciones-updates");
    };
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-search-container]")) {
        setMostrarSugerencias(false);
      }
    };

    if (mostrarSugerencias) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarSugerencias]);

  // Obtener sugerencias de ocupantes basadas en la búsqueda (con useMemo)
  const sugerencias = useMemo(() => {
    if (busquedaDebounced.length < 2) return [];

    const resultado: Array<{ ocupante: Ocupante; habitacion: Habitacion }> = [];
    const searchLower = busquedaDebounced.toLowerCase();

    for (const hab of habitaciones) {
      for (const ocupante of hab.ocupantes) {
        if (ocupante.nombre.toLowerCase().includes(searchLower)) {
          resultado.push({ ocupante, habitacion: hab });
          if (resultado.length >= 5) break; // Limitar a 5 sugerencias
        }
      }
      if (resultado.length >= 5) break;
    }

    return resultado;
  }, [busquedaDebounced, habitaciones]);

  // Función para seleccionar un ocupante
  const seleccionarOcupante = (ocupante: Ocupante, habitacion: Habitacion) => {
    // Cerrar sugerencias y limpiar búsqueda primero
    setMostrarSugerencias(false);
    setBusqueda("");

    // Resaltar el ocupante inmediatamente
    setOcupanteResaltado(ocupante.id);

    // Abrir el accordion de la habitación
    const habitacionValue = `habitacion-${habitacion.id_habitacion}`;
    setHabitacionAbierta(habitacionValue);

    // Función para centrar el elemento en la pantalla
    const centrarElemento = (elemento: HTMLElement) => {
      const rect = elemento.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top + window.scrollY;
      const elementHeight = rect.height;

      // Calcular la posición Y que centraría el elemento en la pantalla
      const targetY = elementTop - (windowHeight / 2) + (elementHeight / 2);

      // Hacer scroll suave a esa posición
      window.scrollTo({
        top: targetY,
        behavior: "smooth"
      });
    };

    // Estrategia: múltiples intentos de scroll con delays incrementales
    // Esto asegura que el scroll se ejecute incluso si el accordion tarda más de lo esperado

    // Intento 1: Después de 300ms
    setTimeout(() => {
      const elemento = document.getElementById(`ocupante-${ocupante.id}`);
      if (elemento && elemento.offsetHeight > 0) {
        centrarElemento(elemento);
      }
    }, 300);

    // Intento 2: Después de 600ms (por si el accordion está animándose)
    setTimeout(() => {
      const elemento = document.getElementById(`ocupante-${ocupante.id}`);
      if (elemento && elemento.offsetHeight > 0) {
        centrarElemento(elemento);
      }
    }, 600);

    // Intento 3: Después de 900ms (asegurar que el accordion terminó)
    setTimeout(() => {
      const elemento = document.getElementById(`ocupante-${ocupante.id}`);
      if (elemento && elemento.offsetHeight > 0) {
        centrarElemento(elemento);
      }
    }, 900);

    // Intento final: Después de 1200ms
    setTimeout(() => {
      const elemento = document.getElementById(`ocupante-${ocupante.id}`);
      if (elemento && elemento.offsetHeight > 0) {
        centrarElemento(elemento);
      } else {
        // Fallback: scroll a la habitación si el ocupante no se encuentra
        const elementoHabitacion = document.getElementById(`habitacion-${habitacion.id_habitacion}`);
        if (elementoHabitacion) {
          const rect = elementoHabitacion.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const elementTop = rect.top + window.scrollY;
          const elementHeight = rect.height;
          const targetY = elementTop - (windowHeight / 2) + (elementHeight / 2);

          window.scrollTo({
            top: targetY,
            behavior: "smooth"
          });
        }
      }
    }, 1200);

    // Quitar el resaltado después de 5 segundos
    setTimeout(() => {
      setOcupanteResaltado(null);
    }, 5000);
  };

  // Filtrado de habitaciones optimizado con useMemo
  const habitacionesFiltradas = useMemo(() => {
    return habitaciones.filter((hab) => {
      // Solo filtrar por género
      // La búsqueda NO filtra habitaciones, solo muestra sugerencias de ocupantes
      return filtroGenero === "Todas" || hab.sexo === filtroGenero;
    });
  }, [habitaciones, filtroGenero]);

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje === 0) return "bg-[#9ECC8D]"; // Verde claro - vacía
    if (porcentaje < 50) return "bg-[#B4DABD]"; // Verde medio
    if (porcentaje < 75) return "bg-[#F5A962]/30"; // Amarillo suave
    if (porcentaje < 100) return "bg-[#F5A962]/60"; // Naranja
    return "bg-red-100"; // Rojo suave - llena
  };

  const getOcupacionBadgeColor = (porcentaje: number) => {
    if (porcentaje === 0) return "bg-green-500";
    if (porcentaje < 50) return "bg-green-400";
    if (porcentaje < 75) return "bg-yellow-500";
    if (porcentaje < 100) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressBarColor = (porcentaje: number) => {
    if (porcentaje === 0) return "bg-green-500";
    if (porcentaje < 50) return "bg-green-400";
    if (porcentaje < 75) return "bg-yellow-500";
    if (porcentaje < 100) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
      {/* Estilos para animación */}
      <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />

      <header className="p-4 bg-[#9ECC8D] shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-center text-[#015481]">
          Control de Habitaciones
        </h1>
        <p className="text-center text-sm mt-1 font-medium text-[#015481]">
          Gestión de ocupación en tiempo real
        </p>
      </header>

      <main className="container mx-auto px-3 py-4 space-y-4 max-w-md pb-8">
        {/* Buscador */}
        <Card className="bg-white/20 backdrop-blur border-none shadow-lg relative z-[60]">
          <CardContent className="p-4">
            <div className="relative" data-search-container>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#015481]/50 z-10" />
              <Input
                type="text"
                placeholder="Buscar habitación o ocupante..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setMostrarSugerencias(e.target.value.length >= 2);
                }}
                onFocus={() => {
                  if (busqueda.length >= 2) {
                    setMostrarSugerencias(true);
                  }
                }}
                className="pl-10 pr-10 bg-white/70 border-[#015481]/30 placeholder:text-[#015481]/50 text-[#015481] focus:bg-white"
              />
              {busqueda && (
                <button
                  onClick={() => {
                    setBusqueda("");
                    setMostrarSugerencias(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#015481]/50 hover:text-[#015481] z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Panel de sugerencias */}
              {mostrarSugerencias && busqueda.length >= 2 && sugerencias.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-[#015481]/20 max-h-64 overflow-y-auto z-[100]">
                  {sugerencias.map(({ ocupante, habitacion }) => (
                    <button
                      key={`${habitacion.id_habitacion}-${ocupante.id}`}
                      onClick={() => seleccionarOcupante(ocupante, habitacion)}
                      className="w-full p-3 hover:bg-[#B4DABD]/30 transition-colors border-b border-[#015481]/10 last:border-b-0 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#015481]">{ocupante.nombre}</p>
                          <p className="text-xs text-[#015481]/60">
                            {ocupante.edad} años · {ocupante.compania}
                          </p>
                        </div>
                        <Badge className="bg-[#2B5F7F] text-white">
                          {habitacion.habitacion}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Mensaje cuando no hay resultados */}
              {mostrarSugerencias && busqueda.length >= 2 && busquedaDebounced.length >= 2 && sugerencias.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-[#015481]/20 p-4 z-[100]">
                  <p className="text-sm text-[#015481]/60 text-center">
                    No se encontraron ocupantes con ese nombre
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtros por género */}
        <Card className="bg-white/20 backdrop-blur border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <span className="text-[#015481] font-semibold flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Filtrar por género:
              </span>
              <div className="grid grid-cols-3 gap-2 w-full">
                <Button
                  variant={filtroGenero === "Todas" ? "default" : "outline"}
                  size="sm"
                  className={`${
                    filtroGenero === "Todas"
                      ? "bg-[#2B5F7F] text-white hover:bg-[#2B5F7F]/90"
                      : "bg-white/50 text-[#015481] border-[#015481]/30 hover:bg-white/70"
                  } font-semibold text-xs`}
                  onClick={() => setFiltroGenero("Todas")}
                >
                  Todas
                </Button>
                <Button
                  variant={filtroGenero === "H" ? "default" : "outline"}
                  size="sm"
                  className={`${
                    filtroGenero === "H"
                      ? "bg-[#2B5F7F] text-white hover:bg-[#2B5F7F]/90"
                      : "bg-white/50 text-[#015481] border-[#015481]/30 hover:bg-white/70"
                  } font-semibold text-xs`}
                  onClick={() => setFiltroGenero("H")}
                >
                  Hombres
                </Button>
                <Button
                  variant={filtroGenero === "M" ? "default" : "outline"}
                  size="sm"
                  className={`${
                    filtroGenero === "M"
                      ? "bg-[#2B5F7F] text-white hover:bg-[#2B5F7F]/90"
                      : "bg-white/50 text-[#015481] border-[#015481]/30 hover:bg-white/70"
                  } font-semibold text-xs`}
                  onClick={() => setFiltroGenero("M")}
                >
                  Mujeres
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de ocupación */}
        <Card className="bg-white/20 backdrop-blur border-none shadow-lg">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-3xl font-bold text-[#015481]">
                  {habitacionesFiltradas.length}
                </p>
                <p className="text-xs text-[#015481]/70 font-medium mt-1">
                  Habitaciones
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#015481]">
                  {habitacionesFiltradas.reduce(
                    (acc, hab) => acc + hab.ocupados,
                    0
                  )}
                </p>
                <p className="text-xs text-[#015481]/70 font-medium mt-1">
                  Ocupadas
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#015481]">
                  {habitacionesFiltradas.reduce(
                    (acc, hab) => acc + hab.libres,
                    0
                  )}
                </p>
                <p className="text-xs text-[#015481]/70 font-medium mt-1">
                  Disponibles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de habitaciones */}
        {loading ? (
          <Card className="bg-white/20 backdrop-blur border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-[#015481] font-medium">
                Cargando habitaciones...
              </p>
            </CardContent>
          </Card>
        ) : habitacionesFiltradas.length === 0 ? (
          <Card className="bg-white/20 backdrop-blur border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-[#015481] font-medium">
                No hay habitaciones disponibles para este filtro
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="space-y-4"
            value={habitacionAbierta}
            onValueChange={setHabitacionAbierta}
          >
            {habitacionesFiltradas.map((habitacion) => {
              const porcentajeOcupacion = Math.round(
                (habitacion.ocupados / habitacion.camas) * 100
              );

              return (
                <AccordionItem
                  key={habitacion.id_habitacion}
                  value={`habitacion-${habitacion.id_habitacion}`}
                  id={`habitacion-${habitacion.id_habitacion}`}
                  className={`border-none rounded-xl overflow-hidden shadow-lg ${getOcupacionColor(
                    porcentajeOcupacion
                  )}`}
                >
                  <AccordionTrigger className="px-4 py-5 hover:no-underline">
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/50 p-2.5 rounded-lg">
                            <Bed className="h-5 w-5 text-[#015481]" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-base font-bold text-[#015481]">
                              {habitacion.habitacion}
                            </h3>
                            <p className="text-xs text-[#015481]/70 font-medium">
                              {habitacion.ocupados}/{habitacion.camas} camas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              habitacion.sexo === "H"
                                ? "bg-[#2B5F7F]"
                                : "bg-[#F5A962]"
                            } text-white font-semibold text-xs px-2 py-1`}
                          >
                            {habitacion.sexo === "H" ? "H" : "M"}
                          </Badge>
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${getOcupacionBadgeColor(
                              porcentajeOcupacion
                            )}`}
                          ></div>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(
                            porcentajeOcupacion
                          )} transition-all duration-300`}
                          style={{ width: `${porcentajeOcupacion}%` }}
                        ></div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-5">
                    <div className="bg-white/50 rounded-lg p-4 mt-1">
                      <h4 className="font-bold text-[#015481] mb-3 flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Ocupantes ({habitacion.ocupados})
                      </h4>

                      {habitacion.ocupantes.length === 0 ? (
                        <p className="text-[#015481]/60 text-sm italic py-2">
                          No hay ocupantes registrados
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {habitacion.ocupantes.map((ocupante) => {
                            const isResaltado = ocupanteResaltado === ocupante.id;

                            return (
                              <button
                                key={ocupante.id}
                                id={`ocupante-${ocupante.id}`}
                                onClick={() => router.push(`/registro/${ocupante.id}`)}
                                className={`w-full flex items-center gap-3 rounded-lg p-3 shadow-sm transition-all active:scale-95 hover:scale-[1.02] ${
                                  isResaltado
                                    ? "border-2"
                                    : ocupante.tipo === "Staff"
                                    ? "bg-[#F5A962]/40 border-2 border-[#F5A962]"
                                    : "bg-white/70"
                                }`}
                                style={
                                  isResaltado
                                    ? {
                                        animation: "pulse-highlight 0.8s ease-in-out infinite",
                                        backgroundColor: "rgba(245, 169, 98, 0.4)",
                                        borderColor: "#F5A962",
                                      }
                                    : undefined
                                }
                              >
                                <div
                                  className={`p-2 rounded-full flex-shrink-0 ${
                                    ocupante.tipo === "Staff"
                                      ? "bg-[#F5A962]/40"
                                      : "bg-[#2B5F7F]/20"
                                  }`}
                                >
                                  <User className="h-4 w-4 text-[#015481]" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[#015481] text-sm truncate">
                                      {ocupante.nombre}
                                    </p>
                                    {ocupante.tipo === "Staff" && (
                                      <Badge className="bg-[#F5A962] text-white font-bold text-xs px-1.5 py-0 h-5">
                                        STAFF
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#015481]/60">
                                    {ocupante.edad} años · {ocupante.compania}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Mostrar camas disponibles */}
                      {habitacion.libres > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#015481]/10">
                          <p className="text-sm text-[#015481]/70 font-medium flex items-center gap-2">
                            <Bed className="h-4 w-4" />
                            {habitacion.libres} cama
                            {habitacion.libres !== 1 ? "s" : ""} disponible
                            {habitacion.libres !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </main>
    </div>
  );
}
