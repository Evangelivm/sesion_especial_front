"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Users, UserRound, MapPin, Check, X, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket";
import RadialMenu from "@/components/radial-menu";
import { useMobile } from "@/hooks/use-mobile";

interface Participant {
  id: number;
  name: string;
  gender: string;
  present: boolean;
  stake: string;
  ward: string;
  location: string;
}

interface Company {
  id: number;
  name: string;
  participants: Participant[];
}

interface ParticipanteStats {
  nombres: string;
  sexo: "H" | "M";
  estaca: string;
  barrio: string;
  compañia: number;
  habitacion: string;
  asistio: "Si" | "No";
}

const transformStatsToCompanies = (
  statsData: ParticipanteStats[]
): Company[] => {
  if (!Array.isArray(statsData)) {
    console.error("Expected statsData to be an array, but got:", statsData);
    return [];
  }

  const groupedByCompany = statsData.reduce((acc, participant) => {
    const companyId = participant.compañia;
    if (!acc[companyId]) {
      acc[companyId] = [];
    }
    acc[companyId].push(participant);
    return acc;
  }, {} as Record<number, ParticipanteStats[]>);

  const companies = Object.entries(groupedByCompany).map(
    ([companyId, participants]) => {
      const id = parseInt(companyId);
      return {
        id,
        name: id === 1 ? "Sin Compañía" : id === 2 ? "Staff" : `Compañía ${id - 2}`,
        participants: participants.map((p, index) => ({
          id: index + 1,
          name: p.nombres,
          gender: p.sexo,
          present: p.asistio === "Si",
          stake: p.estaca,
          ward: p.barrio,
          location: p.habitacion,
        })),
      };
    }
  );

  return companies.sort((a, b) => a.id - b.id);
};

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedCompanyIds, setUpdatedCompanyIds] = useState<number[]>([]);
  const previousDataRef = useRef<Record<number, number>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isMobile = useMobile();

  useEffect(() => {
    const channel = "participantes-ordenados";
    socket.emit("subscribeToParticipantesOrdenados", channel);

    socket.on(channel, (message: any) => {
      try {
        const parsedMessage =
          typeof message === "string" ? JSON.parse(message) : message;

        // Verificar si el mensaje tiene la nueva estructura con metadata
        let participantesData: any[];
        let changedCompany: number | undefined;

        if (parsedMessage.data && Array.isArray(parsedMessage.data)) {
          // Nueva estructura: { data: [...], changedCompany: X }
          participantesData = parsedMessage.data;
          changedCompany = parsedMessage.changedCompany;
        } else if (Array.isArray(parsedMessage)) {
          // Estructura antigua: [...]
          participantesData = parsedMessage;
        } else {
          participantesData = [parsedMessage];
        }

        const validMessages = participantesData.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.nombres === "string" &&
            typeof msg.sexo === "string" &&
            typeof msg.estaca === "string" &&
            typeof msg.barrio === "string" &&
            typeof msg.compañia === "number" &&
            typeof msg.habitacion === "string" &&
            typeof msg.asistio === "string"
        );

        if (validMessages.length > 0) {
          // Actualizar datos
          const transformedData = transformStatsToCompanies(validMessages);
          setCompanies(transformedData);

          // Determinar qué compañía(s) animar
          let companiesToHighlight: number[] = [];

          if (changedCompany !== undefined) {
            // Si el backend nos dice específicamente qué compañía cambió, usar ese dato
            companiesToHighlight = [changedCompany];
            console.log(`Compañía ${changedCompany} actualizada`);
          } else {
            // Fallback: detectar cambios comparando con el estado anterior
            const currentPresent: Record<number, number> = {};
            validMessages.forEach((participant) => {
              const companyId = participant.compañia;
              if (!currentPresent[companyId]) {
                currentPresent[companyId] = 0;
              }
              if (participant.asistio === "Si") {
                currentPresent[companyId]++;
              }
            });

            companiesToHighlight = Object.entries(currentPresent)
              .filter(([companyId, present]) => {
                const previousPresent =
                  previousDataRef.current[Number(companyId)] || 0;
                return present !== previousPresent;
              })
              .map(([companyId]) => Number(companyId));

            // Actualizar referencia
            previousDataRef.current = currentPresent;
          }

          // Animar las compañías que cambiaron
          if (companiesToHighlight.length > 0) {
            setUpdatedCompanyIds(companiesToHighlight);
            setTimeout(() => {
              setUpdatedCompanyIds([]);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Error al parsear mensaje:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      socket.off(channel);
    };
  }, []);

  // Calculate totals
  const totalCompanies = companies.length;
  const totalParticipants = companies.reduce(
    (acc, company) => acc + company.participants.length,
    0
  );
  const maleParticipants = companies.reduce(
    (acc, company) =>
      acc + company.participants.filter((p) => p.gender === "H").length,
    0
  );
  const femaleParticipants = companies.reduce(
    (acc, company) =>
      acc + company.participants.filter((p) => p.gender === "M").length,
    0
  );

  const stats = [
    { title: "Total Compañías", value: totalCompanies, icon: Building2 },
    { title: "Total Participantes", value: totalParticipants, icon: Users },
    { title: "Hombres", value: maleParticipants, icon: UserRound },
    { title: "Mujeres", value: femaleParticipants, icon: UserRound },
  ];

  // Radial menu handlers
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setShowMenu(false);
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
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] flex items-center justify-center">
        <div className="text-[#015481] text-xl font-semibold">Cargando...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF]"
      onContextMenu={!isMobile ? handleRightClick : undefined}
    >
      <header className="p-4 bg-[#9ECC8D] shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#015481]">
          Dashboard de Compañías
        </h1>
      </header>
      <div className="container mx-auto px-4 py-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 bg-white/15 backdrop-blur border-none hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#F5A962]/20 rounded-full">
                  <stat.icon className="w-6 h-6 text-[#015481]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#015481]/70">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold text-[#015481]">{stat.value}</h3>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const totalParticipants = company.participants.length;
            const maleParticipants = company.participants.filter(
              (p) => p.gender === "H"
            );
            const femaleParticipants = company.participants.filter(
              (p) => p.gender === "M"
            );
            const presentMale = maleParticipants.filter(
              (p) => p.present
            ).length;
            const presentFemale = femaleParticipants.filter(
              (p) => p.present
            ).length;
            const totalPresent = presentMale + presentFemale;

            return (
              <Card
                key={company.id}
                className={cn(
                  "p-6 cursor-pointer hover:shadow-lg transition-all bg-white/15 backdrop-blur border-none",
                  updatedCompanyIds.includes(company.id) ? "ring-4 ring-[#F5A962] ring-opacity-70" : ""
                )}
                onClick={() => setSelectedCompany(company)}
              >
                <h3 className="text-xl font-semibold mb-2 text-[#015481]">{company.name}</h3>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#F5A962] text-[#015481] border-none font-semibold hover:bg-[#F5A962]/80">
                    Total: {totalPresent}/{totalParticipants}
                  </Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">
                    Hombres: {presentMale}/{maleParticipants.length}
                  </Badge>
                  <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-none">
                    Mujeres: {presentFemale}/{femaleParticipants.length}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Company Details Dialog */}
        <Dialog
          open={!!selectedCompany}
          onOpenChange={() => setSelectedCompany(null)}
        >
          <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur">
            <DialogHeader>
              <DialogTitle>
                <div>
                  <h2 className="text-xl font-semibold text-[#015481]">
                    {selectedCompany?.name}
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#F5A962] text-[#015481] border-none font-semibold hover:bg-[#F5A962]/80">
                      Total:{" "}
                      {
                        selectedCompany?.participants.filter((p) => p.present)
                          .length
                      }
                      /{selectedCompany?.participants.length}
                    </Badge>
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">
                      Hombres:{" "}
                      {
                        selectedCompany?.participants.filter(
                          (p) => p.gender === "H" && p.present
                        ).length
                      }
                      /
                      {
                        selectedCompany?.participants.filter(
                          (p) => p.gender === "H"
                        ).length
                      }
                    </Badge>
                    <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-none">
                      Mujeres:{" "}
                      {
                        selectedCompany?.participants.filter(
                          (p) => p.gender === "M" && p.present
                        ).length
                      }
                      /
                      {
                        selectedCompany?.participants.filter(
                          (p) => p.gender === "M"
                        ).length
                      }
                    </Badge>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {selectedCompany?.participants.map((participant) => (
                  <Card key={participant.id} className="p-4 bg-white/50 backdrop-blur border-[#015481]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {participant.gender === "H" ? (
                          <UserRound className="w-5 h-5 text-blue-500" />
                        ) : (
                          <UserRound className="w-5 h-5 text-pink-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#015481]">{participant.name}</p>
                            <div className="flex items-center text-[#015481]/60 mb-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {participant.location}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-[#015481]/70">
                            Estaca {participant.stake}, {participant.ward}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center",
                          participant.present
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      >
                        {participant.present ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

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
    </div>
  );
}

export default App;
