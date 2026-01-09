"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getParticipantes, buscarParticipante } from "@/lib/connections";
import { ResultadosParticipante } from "./result";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { socket } from "@/lib/socket";

interface AdminSettings {
  soloStaff: boolean;
  inscripcionesCerradas: boolean;
}

export default function AsistenciaPage() {
  const [participantes, setParticipantes] = useState<
    { id: number; name: string; tipo: string }[]
  >([]);
  const [allParticipantes, setAllParticipantes] = useState<
    { id: number; name: string; tipo: string }[]
  >([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [participanteInfo, setParticipanteInfo] = useState<any>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    soloStaff: false,
    inscripcionesCerradas: false,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    let hasInitialConnection = false;

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      socket.emit("subscribeToAdminSettings");

      // Notificar reconexión (solo si no es la primera conexión)
      if (hasInitialConnection) {
        console.log("Conexión en tiempo real restablecida");
      }
      hasInitialConnection = true;
    });

    socket.on("disconnect", () => {
      console.warn("WebSocket desconectado");
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión de WebSocket:", err);
    });

    socket.on("admin-settings", (message: string) => {
      console.log("Received admin settings update:", message);
      try {
        const updatedSettings = JSON.parse(message);
        setAdminSettings(updatedSettings);
      } catch (error) {
        console.error("Error parsing admin settings:", error);
      }
    });

    // If already connected, subscribe immediately
    if (socket.connected) {
      socket.emit("subscribeToAdminSettings");
      hasInitialConnection = true;
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("admin-settings");
    };
  }, []);

  // Fetch initial admin settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/admin/settings`);
        if (response.ok) {
          const data = await response.json();
          setAdminSettings(data);
        }
      } catch (error) {
        console.error("Error fetching admin settings:", error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        //console.log("Iniciando fetchParticipantes");
        const data = await getParticipantes();
        console.log("Primeros 3 participantes:", data.slice(0, 3));
        setAllParticipantes(data);
        setParticipantes(data);
      } catch (error) {
        console.error("Error en fetchParticipantes:", error);
      }
    };

    fetchParticipantes();
  }, []);

  // Filter participantes based on soloStaff setting
  useEffect(() => {
    console.log("Aplicando filtro soloStaff:", adminSettings.soloStaff);
    console.log("Total participantes:", allParticipantes.length);

    if (adminSettings.soloStaff) {
      // Filtrar solo Staff (case-insensitive)
      const staffOnly = allParticipantes.filter((p) => {
        const isStaff = p.tipo?.toLowerCase() === "staff";
        if (isStaff) {
          console.log("Staff encontrado:", p.name, "tipo:", p.tipo);
        }
        return isStaff;
      });
      console.log("Staff filtrados:", staffOnly.length);
      setParticipantes(staffOnly);
    } else {
      setParticipantes(allParticipantes);
    }
  }, [adminSettings.soloStaff, allParticipantes]);

  const handleSelect = (id: number) => {
    //console.log("handleSelect llamado con id:", id);
    if (id !== 0) {
      setSelectedId(id);
      //console.log("selectedId actualizado a:", id);
    }
  };

  const handleBuscar = async () => {
    //console.log("handleBuscar iniciado");
    //console.log("Valor actual de selectedId:", selectedId);

    if (selectedId !== null) {
      try {
        //console.log("Intentando buscar participante con ID:", selectedId);
        const data = await buscarParticipante(selectedId);
        //console.log("Datos recibidos de buscarParticipante:", data);
        setParticipanteInfo(data);
      } catch (error) {
        //console.error("Error en handleBuscar:", error);
      }
    } else {
      console.log("No se ha seleccionado ningún participante");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
      <header className="p-4 bg-[#9ECC8D] shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#015481]">
          Asistencia de Participantes
        </h1>
        {!adminSettings.inscripcionesCerradas ? (
          <p className="text-center text-sm mt-1 font-bold text-[#015481]">
            Escriba el nombre, seleccione cuando aparezca y hace click en "Buscar"
          </p>
        ) : (
          <p className="text-center text-sm mt-1 font-bold text-red-600">
            Las inscripciones están cerradas
          </p>
        )}
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-2xl">
        {!adminSettings.inscripcionesCerradas ? (
          <>
            <Card className="bg-white/15 backdrop-blur border-none relative z-10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#2B5F7F]">1. Buscar Participante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                  <AutocompleteInput
                    suggestions={participantes}
                    onSelect={handleSelect}
                    onClear={() => {
                      setSelectedId(null);
                      setParticipanteInfo(null);
                    }}
                    className="sm:flex-1 sm:max-w-[500px] sm:min-w-[200px]"
                  />
                  <Button
                    className="bg-[#F5A962] text-[#015481] hover:bg-[#F5A962]/80 whitespace-nowrap px-6 w-full sm:w-auto shadow-md font-semibold"
                    onClick={handleBuscar}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {participanteInfo && (
              <ResultadosParticipante
                participanteInfo={participanteInfo}
                onAsistenciaConfirmada={handleBuscar}
              />
            )}
          </>
        ) : (
          <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#015481] text-center">
                Asistencia Restringida
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-lg text-[#015481] font-semibold">
                Las inscripciones se cerraron, cualquier registro nuevo lo hará el personal de registro
              </p>
              <p className="text-sm text-[#015481]/70 mt-4">
                Para marcar asistencia o registrar nuevos participantes, ingrese al panel de administración
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
