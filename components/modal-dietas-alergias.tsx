"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import { getParticipantesConInfoMedica } from "@/lib/connections";
import ModalInformacionMedica from "@/components/modal-informacion-medica";

interface Participante {
  id: number;
  nombre: string;
  apellido: string;
  tipo: string;
  dieta: string | null;
  obs_dieta: string | null;
  alergia_alimento: string | null;
  alergia_medicamento: string | null;
  alergia_polvo_pelos_acaro: string | null;
}

interface ModalDietasAlergiasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModalDietasAlergias({
  open,
  onOpenChange,
}: ModalDietasAlergiasProps) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [participanteSeleccionado, setParticipanteSeleccionado] =
    useState<Participante | null>(null);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

  useEffect(() => {
    if (open) {
      cargarParticipantes();
    }
  }, [open]);

  const cargarParticipantes = async () => {
    setLoading(true);
    try {
      const data = await getParticipantesConInfoMedica();
      setParticipantes(data);
    } catch (error) {
      console.error("Error al cargar participantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const participantesFiltrados = participantes.filter((p) => {
    const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase());
  });

  const handleEditarParticipante = (participante: Participante) => {
    setParticipanteSeleccionado(participante);
    setModalEdicionAbierto(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Dietas y Alergias</DialogTitle>
            <DialogDescription>
              Gestiona la información de dietas y alergias de todos los
              participantes y staff
            </DialogDescription>
          </DialogHeader>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Lista de participantes */}
          <div className="overflow-y-auto max-h-[50vh] space-y-2">
            {loading ? (
              <p className="text-center text-slate-500 py-8">Cargando...</p>
            ) : participantesFiltrados.length > 0 ? (
              participantesFiltrados.map((participante) => (
                <Card
                  key={participante.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEditarParticipante(participante)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <h3 className="font-medium">
                            {participante.apellido}, {participante.nombre}
                          </h3>
                          <Badge
                            variant={
                              participante.tipo === "Staff"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {participante.tipo}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {participante.dieta === "Si" && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-xs">
                              Dieta
                            </Badge>
                          )}
                          {participante.alergia_alimento === "Si" && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white border-none text-xs">
                              Alergia Alimento
                            </Badge>
                          )}
                          {participante.alergia_medicamento === "Si" && (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none text-xs">
                              Alergia Medicamento
                            </Badge>
                          )}
                          {participante.alergia_polvo_pelos_acaro === "Si" && (
                            <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-none text-xs">
                              Alergia Polvo/Pelos
                            </Badge>
                          )}
                          {participante.dieta !== "Si" &&
                            participante.alergia_alimento !== "Si" &&
                            participante.alergia_medicamento !== "Si" &&
                            participante.alergia_polvo_pelos_acaro !== "Si" && (
                              <Badge
                                variant="outline"
                                className="text-xs text-slate-500"
                              >
                                Sin restricciones
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">
                No se encontraron participantes
              </p>
            )}
          </div>

          <div className="text-sm text-slate-500 text-center">
            {participantesFiltrados.length} participante(s)
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      {participanteSeleccionado && (
        <ModalInformacionMedica
          open={modalEdicionAbierto}
          onOpenChange={setModalEdicionAbierto}
          participanteId={participanteSeleccionado.id}
          participanteNombre={`${participanteSeleccionado.nombre} ${participanteSeleccionado.apellido}`}
          datosActuales={{
            dieta: participanteSeleccionado.dieta,
            obs_dieta: participanteSeleccionado.obs_dieta,
            alergia_alimento: participanteSeleccionado.alergia_alimento,
            alergia_medicamento: participanteSeleccionado.alergia_medicamento,
            alergia_polvo_pelos_acaro:
              participanteSeleccionado.alergia_polvo_pelos_acaro,
          }}
          onSuccess={() => {
            cargarParticipantes();
          }}
        />
      )}
    </>
  );
}
