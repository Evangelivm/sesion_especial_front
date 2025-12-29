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
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronLeft,
  Users,
  UtensilsCrossed,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";

interface ParticipanteStats {
  id: number;
  nombres: string;
  sexo: "H" | "M";
  estaca: string;
  barrio: string;
  compañia: number;
  habitacion: string;
  asistio: "Si" | "No";
  dieta?: "Si" | "No";
  obs_dieta?: string;
  tipo?: string;
}

interface CompaniaStats {
  numero: number;
  total: number;
  hombres: number;
  mujeres: number;
  dietas: number;
  hombres_con_dieta: number;
  mujeres_con_dieta: number;
}

export default function AlimentosPage() {
  const router = useRouter();
  const [participantes, setParticipantes] = useState<ParticipanteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const channel = "alimentos-stats";

    // Suscribirse al canal de WebSocket
    socket.emit("subscribeToAlimentosStats");

    // Escuchar actualizaciones en tiempo real
    socket.on(channel, (message: any) => {
      try {
        const parsedMessage =
          typeof message === "string" ? JSON.parse(message) : message;
        const data = Array.isArray(parsedMessage)
          ? parsedMessage
          : [parsedMessage];

        setParticipantes(data);
        setLoading(false);

        console.log("Datos de alimentos actualizados en tiempo real");
      } catch (error) {
        console.error("Error al procesar mensaje de WebSocket:", error);
        toast.error("Error al procesar actualización de datos");
      }
    });

    // Manejar errores de conexión
    socket.on("error", (error: any) => {
      console.error("Error de WebSocket:", error);
      toast.error("Error de conexión con el servidor");
      setLoading(false);
    });

    // Cleanup al desmontar el componente
    return () => {
      socket.off(channel);
      socket.off("error");
    };
  }, []);

  // Calcular estadísticas
  const participantesAsistentes = participantes.filter(
    (p) => p.asistio === "Si"
  );

  // Participantes: solo los que tienen tipo "Participante" y asistieron
  const soloParticipantes = participantesAsistentes.filter(
    (p) => p.tipo === "Participante"
  );
  const totalParticipantes = soloParticipantes.length;

  const matrimoniosDirectores = 4; // 2 matrimonios = 4 personas

  // Staff: solo las personas con tipo "Staff" (sin importar compañía)
  const staffPersonas = participantesAsistentes.filter(
    (p) => p.tipo === "Staff"
  );
  const staffCount = staffPersonas.length;

  // Total presentes: Participantes + Staff + Directores
  const totalPresentes = totalParticipantes + staffCount + matrimoniosDirectores;

  // Estadísticas por compañía
  const companiaStats: { [key: number]: CompaniaStats } = {};

  participantesAsistentes.forEach((p) => {
    if (!companiaStats[p.compañia]) {
      companiaStats[p.compañia] = {
        numero: p.compañia,
        total: 0,
        hombres: 0,
        mujeres: 0,
        dietas: 0,
        hombres_con_dieta: 0,
        mujeres_con_dieta: 0,
      };
    }

    // El TOTAL siempre se incrementa (todos los asistentes de la compañía)
    companiaStats[p.compañia].total++;

    // Si tiene dieta especial, solo incrementar dietas
    if (p.dieta === "Si") {
      companiaStats[p.compañia].dietas++;
      if (p.sexo === "H") {
        companiaStats[p.compañia].hombres_con_dieta++;
      } else {
        companiaStats[p.compañia].mujeres_con_dieta++;
      }
    } else {
      // Si NO tiene dieta especial, contar como hombre o mujer
      if (p.sexo === "H") {
        companiaStats[p.compañia].hombres++;
      } else {
        companiaStats[p.compañia].mujeres++;
      }
    }
  });

  const companiasOrdenadas = Object.values(companiaStats).sort(
    (a, b) => a.numero - b.numero
  );

  // Calcular total de dietas especiales
  const totalDietasEspeciales = participantesAsistentes.filter(
    (p) => p.dieta === "Si"
  ).length;
  const platosNormales = totalPresentes - totalDietasEspeciales;

  const generarInformeDietas = () => {
    let informe = "INFORME DE DIETAS ESPECIALES POR COMPAÑÍA\n";
    informe += "=" .repeat(50) + "\n";

    let totalDietas = 0;

    companiasOrdenadas.forEach((comp) => {
      const dietasCompania = participantesAsistentes.filter(
        (p) => p.compañia === comp.numero && p.dieta === "Si"
      );

      if (dietasCompania.length > 0) {
        totalDietas += dietasCompania.length;
        const nombreCompania = comp.numero === 1 ? "Sin Compañía" : comp.numero === 2 ? "Staff" : `Compañía ${comp.numero - 2}`;
        informe += `*${nombreCompania} - ${dietasCompania.length} ${dietasCompania.length === 1 ? "dieta" : "dietas"}*\n`;
        informe += "-".repeat(50) + "\n";

        dietasCompania.forEach((p, idx) => {
          informe += `${idx + 1}. ${p.nombres} (${p.sexo})\n`;
        });

        informe += "\n";
      }
    });

    informe += "=" .repeat(50) + "\n";
    informe += `*TOTAL DE DIETAS ESPECIALES: ${totalDietas}*\n`;
    informe += `*PLATOS NORMALES: ${totalPresentes - totalDietas}*\n`;
    informe += `*TOTAL DE PLATOS: ${totalPresentes}*\n`;
    informe += "=" .repeat(50) + "\n";

    return informe;
  };

  const copiarInforme = async () => {
    try {
      const informe = generarInformeDietas();
      await navigator.clipboard.writeText(informe);
      setCopied(true);
      toast.success("Informe copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar el informe");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5AB04] to-[#01667C] flex items-center justify-center">
        <div className="text-white text-xl">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5AB04] to-[#01667C]">
      {/* Header */}
      <header className="bg-[#F5AB04] shadow-lg p-4">
        <div className="container mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:bg-[#FFB81C]/20 p-2 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6" />
              Control de Alimentos
            </h1>
            <p className="text-white/90 text-sm">
              Gestión de cantidades y dietas especiales
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 max-w-6xl space-y-6">
        {/* Tarjeta de Totales Generales */}
        <Card className="bg-white/95 backdrop-blur border-2 border-white/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6 text-[#01667C]" />
              Resumen General de Presentes
            </CardTitle>
            <CardDescription>
              Total de personas para las que se debe preparar alimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Participantes
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {totalParticipantes}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-purple-600 font-medium mb-1">
                  Directores
                </div>
                <div className="text-3xl font-bold text-purple-700">
                  {matrimoniosDirectores}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  2 matrimonios
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-green-600 font-medium mb-1">
                  Staff
                </div>
                <div className="text-3xl font-bold text-green-700">
                  {staffCount}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Consejeros, auxiliares, generales y logística
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#F5AB04] to-[#FFB81C] p-4 rounded-lg border-2 border-[#F5AB04]">
                <div className="text-sm text-white font-medium mb-1">
                  Total General
                </div>
                <div className="text-4xl font-bold text-white">
                  {totalPresentes}
                </div>
              </div>
            </div>

            {/* Desglose de platos normales y dietas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-200">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border-2 border-emerald-200">
                <div className="text-sm text-emerald-600 font-medium mb-1">
                  Platos Normales
                </div>
                <div className="text-3xl font-bold text-emerald-700">
                  {platosNormales}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-orange-600 font-medium mb-1">
                  Dietas Especiales
                </div>
                <div className="text-3xl font-bold text-orange-700">
                  {totalDietasEspeciales}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border-2 border-slate-200">
                <div className="text-sm text-slate-600 font-medium mb-1">
                  Total de platos a preparar
                </div>
                <div className="text-3xl font-bold text-slate-700">
                  {totalPresentes}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desglose por Compañía */}
        <Card className="bg-white/95 backdrop-blur border-2 border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#01667C]" />
                    Desglose por Compañía
                  </CardTitle>
                  <CardDescription>
                    Total de participantes por cada compañía. Haz clic para ver dietas especiales.
                  </CardDescription>
                </div>
                <Button
                  onClick={copiarInforme}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-[#01667C] text-white hover:bg-[#01667C]/90 border-[#01667C]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Informe
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                {companiasOrdenadas.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {companiasOrdenadas.map((comp, index) => {
                      // Filtrar participantes con dieta de esta compañía
                      const dietasCompania = participantesAsistentes.filter(
                        (p) => p.compañia === comp.numero && p.dieta === "Si"
                      );

                      return (
                        <AccordionItem
                          key={`company-${comp.numero}-${index}`}
                          value={`company-${comp.numero}`}
                          className="border rounded-lg bg-slate-50 px-4 data-[state=open]:bg-slate-100"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3 flex-1">
                                <Badge className="bg-[#01667C] hover:bg-[#01667C]/90">
                                  {comp.numero === 1 ? "SC" : comp.numero === 2 ? "Staff" : `C${comp.numero - 2}`}
                                </Badge>
                                <div className="text-sm flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-600 font-semibold">👨 {comp.hombres}</span>
                                    <span className="text-pink-600 font-semibold">👩 {comp.mujeres}</span>
                                  </div>
                                  {comp.dietas > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-50 text-orange-700 border-orange-200"
                                    >
                                      🍽️ {comp.dietas} {comp.dietas === 1 ? "dieta" : "dietas"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-lg font-bold text-slate-700">
                                {comp.total}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            {dietasCompania.length > 0 ? (
                              <div className="space-y-2 pl-2">
                                <p className="text-xs text-slate-600 font-medium mb-2">
                                  Dietas especiales en esta compañía:
                                </p>
                                {dietasCompania.map((participante, idx) => (
                                  <div
                                    key={`diet-comp-${participante.id}-${idx}`}
                                    className={`p-2 rounded-md border ${
                                      participante.tipo === "Staff"
                                        ? "bg-yellow-50 border-yellow-200"
                                        : participante.sexo === "H"
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-pink-50 border-pink-200"
                                    }`}
                                  >
                                    <div className={`font-medium text-sm ${
                                      participante.tipo === "Staff"
                                        ? "text-yellow-700"
                                        : "text-slate-800"
                                    }`}>
                                      {participante.sexo === "H" ? "👨" : "👩"} {participante.nombres}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="bg-white text-slate-700 border-slate-300 text-xs"
                                      >
                                        🏠 {participante.habitacion}
                                      </Badge>
                                      {participante.obs_dieta && (
                                        <span className="text-orange-600 font-medium">
                                          🍽️ {participante.obs_dieta}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic pl-2">
                                No hay dietas especiales en esta compañía
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    No hay datos de compañías
                  </div>
                )}
              </div>
            </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-white/95 backdrop-blur border-2 border-white/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800 mb-1">
                  Información importante:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Los participantes son aquellos con tipo "Participante" que confirmaron asistencia
                  </li>
                  <li>
                    El staff incluye todas las personas con tipo "Staff" que confirmaron asistencia
                  </li>
                  <li>
                    Se agregan 4 directores (2 matrimonios) al total de
                    presentes
                  </li>
                  <li>
                    Las dietas especiales se obtienen de los datos registrados
                    en la base de datos
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
