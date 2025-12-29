import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { confirmarAsistencia } from "@/lib/connections";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface ParticipanteInfo {
  id: number;
  apellidos: string;
  nombres: string;
  compania: string;
  habitacion: string;
  edad: number;
  estaca: string;
  barrio: string;
  asistio: string;
}

interface ResultadosParticipanteProps {
  participanteInfo: ParticipanteInfo;
  onAsistenciaConfirmada: () => void;
}

export const ResultadosParticipante: React.FC<ResultadosParticipanteProps> = ({
  participanteInfo,
  onAsistenciaConfirmada,
}) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Deshabilitar el botón por 2 segundos cuando aparece el componente
    setIsButtonDisabled(true);
    setCountdown(2);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsButtonDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [participanteInfo.id]);
  const handleConfirmarAsistencia = async () => {
    try {
      //console.log("Confirmando asistencia para ID:", participanteInfo.id);
      await confirmarAsistencia(participanteInfo.id);
      //console.log("Asistencia confirmada exitosamente");
      toast.success("Asistencia confirmada exitosamente!");
      onAsistenciaConfirmada();
    } catch (error) {
      console.error("Error al confirmar asistencia:", error);
      toast.error("Error al confirmar asistencia.");
    }
  };
  return (
    <Card className="bg-white/15 backdrop-blur border-none relative z-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#015481]">2. Resultados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="text-[#015481] font-semibold">Estado:</div>
            <div className="text-[#015481] font-medium">
              <Badge
                className={cn(
                  "font-semibold",
                  participanteInfo.asistio === "Si"
                    ? "bg-green-500 hover:bg-green-600 "
                    : "bg-red-500 hover:bg-red-600 "
                )}
              >
                {participanteInfo.asistio === "Si" ? "Asistió" : "No Asistió"}
              </Badge>
            </div>

            <div className="text-[#015481] font-semibold">Apellidos:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.apellidos}
            </div>

            <div className="text-[#015481] font-semibold">Nombres:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.nombres}
            </div>

            <div className="text-[#015481] font-semibold">Compañía:</div>
            <div className="text-[#015481] font-medium">
              <Badge
                className={cn(
                  "font-semibold",
                  participanteInfo.compania === "SC"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : participanteInfo.compania === "Staff"
                    ? "bg-[#FFB81C] hover:bg-[#FFB81C]/90 text-[#006184]"
                    : "bg-blue-500 hover:bg-blue-600"
                )}
              >
                {participanteInfo.compania}
              </Badge>
            </div>

            <div className="text-[#015481] font-semibold">Habitación:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.habitacion}
            </div>

            <div className="text-[#015481] font-semibold">Edad:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.edad}
            </div>

            <div className="text-[#015481] font-semibold">Estaca:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.estaca}
            </div>

            <div className="text-[#015481] font-semibold">Barrio:</div>
            <div className="text-[#015481] font-medium">
              {participanteInfo.barrio}
            </div>
          </div>

          <Button
            className="w-full mt-4 bg-[#2B5F7F] hover:bg-[#2B5F7F]/80 text-white font-semibold shadow-md disabled:opacity-50"
            onClick={handleConfirmarAsistencia}
            disabled={
              participanteInfo.asistio === "Si" ||
              isButtonDisabled ||
              participanteInfo.compania === "SC"
            }
          >
            {participanteInfo.compania === "SC"
              ? "Participante sin Compañía, dirigirlo a la mesa de soluciones"
              : participanteInfo.asistio === "Si"
              ? "Asistencia Confirmada"
              : isButtonDisabled
              ? `Espere ${countdown} segundo${countdown !== 1 ? 's' : ''}...`
              : "Confirmar Asistencia"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
