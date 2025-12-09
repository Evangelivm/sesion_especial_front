"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getParticipantes, buscarParticipante } from "@/lib/connections";
import { ResultadosParticipante } from "./result";
import { AutocompleteInput } from "@/components/autocomplete-input";

export default function AsistenciaPage() {
  const [participantes, setParticipantes] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [participanteInfo, setParticipanteInfo] = useState<any>(null);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        //console.log("Iniciando fetchParticipantes");
        const data = await getParticipantes();
        //console.log("Datos recibidos en fetchParticipantes:", data);
        setParticipantes(data);
      } catch (error) {
        console.error("Error en fetchParticipantes:", error);
      }
    };

    fetchParticipantes();
  }, []);

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
        <p className="text-center text-sm mt-1 font-bold text-[#015481]">
          Escriba el nombre, seleccione cuando aparezca y hace click en "Buscar"
        </p>
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-2xl">
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
      </main>
    </div>
  );
}
