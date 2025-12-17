"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { actualizarInformacionMedica } from "@/lib/connections";

interface ModalInformacionMedicaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participanteId: number;
  participanteNombre: string;
  datosActuales?: {
    dieta?: string | null;
    obs_dieta?: string | null;
    alergia_alimento?: string | null;
    alergia_medicamento?: string | null;
    alergia_polvo_pelos_acaro?: string | null;
  };
  onSuccess?: () => void;
}

export default function ModalInformacionMedica({
  open,
  onOpenChange,
  participanteId,
  participanteNombre,
  datosActuales,
  onSuccess,
}: ModalInformacionMedicaProps) {
  const [dieta, setDieta] = useState<"Si" | "No">("No");
  const [obsDieta, setObsDieta] = useState("");
  const [alergiaAlimento, setAlergiaAlimento] = useState<"Si" | "No">("No");
  const [alergiaMedicamento, setAlergiaMedicamento] = useState<"Si" | "No">("No");
  const [alergiaPolvo, setAlergiaPolvo] = useState<"Si" | "No">("No");
  const [guardando, setGuardando] = useState(false);

  // Cargar datos actuales cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (datosActuales) {
        setDieta((datosActuales.dieta as "Si" | "No") || "No");
        setObsDieta(datosActuales.obs_dieta || "");
        setAlergiaAlimento((datosActuales.alergia_alimento as "Si" | "No") || "No");
        setAlergiaMedicamento((datosActuales.alergia_medicamento as "Si" | "No") || "No");
        setAlergiaPolvo((datosActuales.alergia_polvo_pelos_acaro as "Si" | "No") || "No");
      } else {
        // Reset to defaults if no data
        setDieta("No");
        setObsDieta("");
        setAlergiaAlimento("No");
        setAlergiaMedicamento("No");
        setAlergiaPolvo("No");
      }
    }
  }, [open, datosActuales]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await actualizarInformacionMedica(participanteId, {
        dieta,
        obs_dieta: obsDieta || undefined,
        alergia_alimento: alergiaAlimento,
        alergia_medicamento: alergiaMedicamento,
        alergia_polvo_pelos_acaro: alergiaPolvo,
      });

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar información médica:", error);
      alert("Error al guardar la información médica");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Actualizar Información Médica</DialogTitle>
          <DialogDescription>
            Editar información de dietas y alergias para {participanteNombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dieta */}
          <div className="space-y-2">
            <Label htmlFor="dieta">Dieta Especial</Label>
            <Select value={dieta} onValueChange={(value) => setDieta(value as "Si" | "No")}>
              <SelectTrigger id="dieta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Si">Sí</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones de dieta (solo si dieta es "Si") */}
          {dieta === "Si" && (
            <div className="space-y-2">
              <Label htmlFor="obs_dieta">Observaciones de Dieta</Label>
              <Textarea
                id="obs_dieta"
                placeholder="Describe las restricciones o requerimientos especiales de dieta..."
                value={obsDieta}
                onChange={(e) => setObsDieta(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Alergia a alimentos */}
          <div className="space-y-2">
            <Label htmlFor="alergia_alimento">Alergia a Alimentos</Label>
            <Select
              value={alergiaAlimento}
              onValueChange={(value) => setAlergiaAlimento(value as "Si" | "No")}
            >
              <SelectTrigger id="alergia_alimento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Si">Sí</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alergia a medicamentos */}
          <div className="space-y-2">
            <Label htmlFor="alergia_medicamento">Alergia a Medicamentos</Label>
            <Select
              value={alergiaMedicamento}
              onValueChange={(value) => setAlergiaMedicamento(value as "Si" | "No")}
            >
              <SelectTrigger id="alergia_medicamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Si">Sí</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alergia a polvo/pelos/ácaros */}
          <div className="space-y-2">
            <Label htmlFor="alergia_polvo">Alergia a Polvo/Pelos/Ácaros</Label>
            <Select
              value={alergiaPolvo}
              onValueChange={(value) => setAlergiaPolvo(value as "Si" | "No")}
            >
              <SelectTrigger id="alergia_polvo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Si">Sí</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
