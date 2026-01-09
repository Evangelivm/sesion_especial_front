"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Briefcase, Cake, Send, ArrowLeftRight, Home, UtensilsCrossed } from "lucide-react";
import { getStats } from "@/lib/connections";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import RadialMenu from "@/components/radial-menu";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

interface ParticipanteStats {
  id: number;
  nombres: string;
  sexo: "H" | "M";
  estaca: string;
  barrio: string;
  compañia: number;
  habitacion: string;
  asistio: "Si" | "No";
  nacimiento?: string;
}

export default function DireccionPage() {
  const router = useRouter();
  const [participantesAsistieron, setParticipantesAsistieron] = useState(0);
  const [staffAsistieron, setStaffAsistieron] = useState(0);
  const [cumpleaneros, setCumpleaneros] = useState<ParticipanteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Constante para los matrimonios de directores
  const matrimoniosDirectores = 4; // 2 matrimonios = 4 personas

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStats();

        // Contar participantes que asistieron (compañía > 2)
        const participantesCount = data.filter(
          (p) => p.asistio === "Si" && p.compañia > 2
        ).length;

        // Contar staff que asistieron (compañía === 2)
        const staffCount = data.filter(
          (p) => p.asistio === "Si" && p.compañia === 2
        ).length;

        setParticipantesAsistieron(participantesCount);
        setStaffAsistieron(staffCount);

        // Filtrar cumpleañeros del día que asistieron
        const hoy = new Date();
        const diaHoy = hoy.getDate();
        const mesHoy = hoy.getMonth() + 1; // Los meses en JS van de 0-11

        const cumpleanerosHoy = data.filter((p) => {
          if (!p.nacimiento || p.asistio !== "Si") return false;

          // Parsear la fecha de nacimiento sin timezone (formato: YYYY-MM-DD)
          // Extraer directamente día y mes de la cadena sin conversiones de timezone
          const [, mes, dia] = p.nacimiento.split('-').map(Number);

          return dia === diaHoy && mes === mesHoy;
        });

        setCumpleaneros(cumpleanerosHoy);

      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let hasInitialConnection = false;

    // Manejar conexión
    socket.on('connect', () => {
      console.log('WebSocket conectado correctamente');
      socket.emit('subscribeToDireccionStats');

      // Notificar reconexión (solo si no es la primera conexión)
      if (hasInitialConnection) {
        console.log('Conexión en tiempo real restablecida');
      }
      hasInitialConnection = true;
    });

    socket.on('disconnect', () => {
      console.warn('WebSocket desconectado');
    });

    socket.on('connect_error', (err) => {
      console.error('Error de conexión de WebSocket:', err);
    });

    // Escuchar actualizaciones de estadísticas
    socket.on('direccion-stats', (data: any) => {
      console.log('Actualización de estadísticas recibida:', data);
      const stats = typeof data === 'string' ? JSON.parse(data) : data;

      setParticipantesAsistieron(stats.participantesAsistieron || 0);
      setStaffAsistieron(stats.staffAsistieron || 0);

      // Actualizar cumpleañeros si vienen en la respuesta
      if (stats.cumpleaneros) {
        setCumpleaneros(stats.cumpleaneros);
      }
    });

    // Si ya está conectado, suscribirse inmediatamente
    if (socket.connected) {
      socket.emit('subscribeToDireccionStats');
      hasInitialConnection = true;
    }

    // Cleanup al desmontar
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('direccion-stats');
    };
  }, []);

  // Menu options for radial menu
  const menuOptions = [
    { id: "companies", label: "Compañía", icon: "Users" },
    { id: "person", label: "Persona", icon: "User" },
    { id: "health", label: "Salud", icon: "FirstAid" },
    { id: "registration", label: "Inscripción", icon: "ClipboardList" },
    { id: "attendance", label: "Asistencia", icon: "CalendarCheck" },
    { id: "statistics", label: "Stats", icon: "BarChart2" },
  ];

  // Handle menu option selection
  const handleMenuSelect = (optionId: string) => {
    console.log("Opción seleccionada:", optionId);
    setShowMenu(false);

    switch (optionId) {
      case "health":
        router.push("/atencion-medica");
        break;
      default:
        console.log("Acción no implementada para:", optionId);
    }
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Add right-click event listener for radial menu (desktop only)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!isMobile) {
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isMobile]);

  // Handle mobile menu button click
  const handleMobileMenuClick = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMenuPosition({ x: centerX, y: centerY });
    setShowMenu(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] flex items-center justify-center">
        <div className="text-2xl font-bold text-[#015481]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
      <header className="p-4 bg-[#9ECC8D] shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#015481]">
          Panel de Dirección
        </h1>
        <p className="text-center text-sm mt-1 font-bold text-[#015481]">
          Vista general de asistencia y cumpleaños
        </p>
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-7xl">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card de Participantes con Asistencia */}
          <Card className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-[#F5A962]" />
                Participantes Presentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold text-[#015481]">
                  {participantesAsistieron}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Participantes que marcaron asistencia
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Staff con Asistencia */}
          <Card className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-[#F5A962]" />
                Staff Presente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold text-[#015481]">
                  {staffAsistieron}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Miembros de staff presentes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Total Presentes */}
          <Card className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#F5A962]" />
                Total Presentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold text-[#015481]">
                  {participantesAsistieron + staffAsistieron + matrimoniosDirectores}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total de personas presentes (incluye 2 matrimonios directores)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Rápidos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#015481]">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Permutas */}
            <Card
              className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => router.push("/permuta")}
            >
              <CardHeader>
                <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                  <ArrowLeftRight className="w-6 h-6 text-[#F5A962]" />
                  Permutas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Gestionar intercambios y cambios de compañía
                </p>
              </CardContent>
            </Card>

            {/* Card Habitaciones */}
            <Card
              className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => router.push("/habitaciones")}
            >
              <CardHeader>
                <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                  <Home className="w-6 h-6 text-[#F5A962]" />
                  Habitaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Ver distribución y ocupación de habitaciones
                </p>
              </CardContent>
            </Card>

            {/* Card Alimentos */}
            <Card
              className="bg-white/90 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => router.push("/alimentos")}
            >
              <CardHeader>
                <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
                  <UtensilsCrossed className="w-6 h-6 text-[#F5A962]" />
                  Alimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Gestión de dietas y restricciones alimentarias
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card de Cumpleañeros */}
        <Card className="bg-white/90 backdrop-blur border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2B5F7F] flex items-center gap-2">
              <Cake className="w-6 h-6 text-[#F5A962]" />
              Cumpleaños del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cumpleaneros.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {cumpleaneros.map((persona) => (
                    <Card
                      key={persona.id}
                      className="p-4 bg-gradient-to-r from-[#F5A962]/20 to-[#CAE9EF]/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#015481]">
                            {persona.nombres}
                          </p>
                          <p className="text-sm text-gray-600">
                            {persona.compañia === 1 ? "Sin Compañía" : persona.compañia === 2 ? "Staff" : `Compañía ${persona.compañia - 2}`}
                          </p>
                        </div>
                        <Badge className="bg-[#F5A962] hover:bg-[#F5A962]/80 text-white">
                          <Cake className="w-4 h-4 mr-1" />
                          Cumpleaños
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Cake className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">
                  No hay cumpleaños registrados para hoy
                </p>
                <p className="text-sm mt-1">
                  (Requiere integración con fechas de nacimiento)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button (Mobile only) */}
      {isMobile && (
        <button
          onClick={handleMobileMenuClick}
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
          position={menuPosition}
          onSelect={handleMenuSelect}
          onClose={() => setShowMenu(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
