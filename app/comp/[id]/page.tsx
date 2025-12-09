"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, User, ChevronLeft } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import RadialMenu from "@/components/radial-menu";
import Link from "next/link";
import gsap from "gsap";
import { getCompanyMembers } from "@/lib/connections";
import { useParams } from "next/navigation";

interface CompanyMember {
  id: number;
  nombres: string;
  edad?: number;
  estaca: string;
  habitacion: string;
  sexo: "H" | "M";
  asistio: "Si" | "No";
  comp: string;
  tipo: "Participante" | "Staff";
}

interface Company {
  id: number;
  name: string;
  maleCount: number;
  maleTotal: number;
  femaleCount: number;
  femaleTotal: number;
  members: CompanyMember[];
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [counselors, setCounselors] = useState<{
    male: { id: number | null; name: string };
    female: { id: number | null; name: string };
  }>({
    male: { id: null, name: "No asignado" },
    female: { id: null, name: "No asignada" },
  });
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"H" | "M">("H");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isMobile = useMobile();
  const params = useParams();

  // Refs for elements we want to animate
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const maleTabRef = useRef<HTMLButtonElement>(null);
  const femaleTabRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const memberRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Color values
  const colors = {
    H: {
      primary: "#2563eb", // blue-600
      secondary: "#1d4ed8", // blue-700
      badge: "#dbeafe", // blue-100
      badgeText: "#1e40af", // blue-800
    },
    M: {
      primary: "#db2777", // pink-600
      secondary: "#be185d", // pink-700
      badge: "#fce7f3", // pink-100
      badgeText: "#9d174d", // pink-800
    },
  };

  useEffect(() => {
    const fetchCompanyData = async () => {
      const companyIdFromUrl = Number(params.id);
      if (isNaN(companyIdFromUrl)) return;

      try {
        const members: CompanyMember[] = await getCompanyMembers(
          companyIdFromUrl
        );

        if (members.length === 0) {
          setCompany({
            id: companyIdFromUrl,
            name: `Compañía ${companyIdFromUrl}`,
            maleCount: 0,
            maleTotal: 0,
            femaleCount: 0,
            femaleTotal: 0,
            members: [],
          });
          return;
        }

        const staff = members.filter((m) => m.tipo === "Staff");
        const participants = members.filter((m) => m.tipo === "Participante");

        const maleCounselor = staff.find((s) => s.sexo === "H");
        const femaleCounselor = staff.find((s) => s.sexo === "M");

        setCounselors({
          male: {
            id: maleCounselor?.id || null,
            name: maleCounselor?.nombres || "No asignado",
          },
          female: {
            id: femaleCounselor?.id || null,
            name: femaleCounselor?.nombres || "No asignada",
          },
        });

        const companyComp = members[0].comp;
        const companyId = parseInt(companyComp.replace("C", ""), 10);

        const maleMembers = participants.filter((m) => m.sexo === "H");
        const femaleMembers = participants.filter((m) => m.sexo === "M");

        const maleCount = maleMembers.filter((m) => m.asistio === "Si").length;
        const femaleCount = femaleMembers.filter(
          (m) => m.asistio === "Si"
        ).length;

        setCompany({
          id: companyId,
          name: `Compañía ${companyId}`,
          maleCount,
          maleTotal: maleMembers.length,
          femaleCount,
          femaleTotal: femaleMembers.length,
          members: participants,
        });
      } catch (error) {
        console.error("Failed to fetch company members:", error);
      }
    };

    fetchCompanyData();
  }, [params.id]);

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

  // Initialize animations for member items
  useEffect(() => {
    if (memberRefs.current.length > 0) {
      gsap.fromTo(
        memberRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, []);

  // Handle tab change with GSAP animation
  const handleTabChange = (tab: "H" | "M") => {
    if (tab === activeTab || isTransitioning) return;

    setIsTransitioning(true);

    // Get the color scheme based on the selected tab
    const colorScheme = tab === "H" ? colors.H : colors.M;

    // Create a GSAP timeline for smooth transitions
    const tl = gsap.timeline({
      onComplete: () => {
        setActiveTab(tab);
        setIsTransitioning(false);
      },
    });

    // Animate header gradient
    if (headerRef.current) {
      tl.to(
        headerRef.current,
        {
          background: `linear-gradient(to right, ${colorScheme.primary}, ${colorScheme.secondary})`,
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Animate card border
    if (cardRef.current) {
      tl.to(
        cardRef.current,
        {
          borderColor: colorScheme.primary,
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Animate add button
    if (addButtonRef.current) {
      tl.to(
        addButtonRef.current,
        {
          backgroundColor: colorScheme.primary,
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Animate tab backgrounds
    if (maleTabRef.current && femaleTabRef.current) {
      if (tab === "H") {
        tl.to(
          maleTabRef.current,
          {
            backgroundColor: colorScheme.primary,
            color: "white",
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        );
        tl.to(
          femaleTabRef.current,
          {
            backgroundColor: "white",
            color: "#334155", // slate-700
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        );
      } else {
        tl.to(
          femaleTabRef.current,
          {
            backgroundColor: colorScheme.primary,
            color: "white",
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        );
        tl.to(
          maleTabRef.current,
          {
            backgroundColor: "white",
            color: "#334155", // slate-700
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        );
      }
    }

    // Animate content transition
    if (cardContentRef.current) {
      // First fade out and move current content
      tl.to(cardContentRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.in",
      });

      // Then update the content (this happens in the component re-render)
      tl.call(() => setActiveTab(tab));

      // Then fade in and move new content
      tl.to(cardContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
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

  // Filter members based on active tab
  const filteredMembers =
    company?.members.filter(
      (member) => member.asistio === "Si" && member.sexo === activeTab
    ) || [];

  // Reset member refs array when members change
  useEffect(() => {
    memberRefs.current = memberRefs.current.slice(0, filteredMembers.length);

    // Animate new members
    if (memberRefs.current.length > 0 && !isTransitioning) {
      gsap.fromTo(
        memberRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [filteredMembers, isTransitioning]);

  // Get current color scheme
  const currentColors = activeTab === "H" ? colors.H : colors.M;

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-50 pb-10 relative"
      onContextMenu={!isMobile ? handleRightClick : undefined}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="w-full p-4 flex items-center"
        style={{
          background: `linear-gradient(to right, ${currentColors.primary}, ${currentColors.secondary})`,
        }}
      >
        <Link href="/" className="text-white mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">{company.name}</h1>
      </div>

      {/* Company content */}
      <div className="container max-w-md px-4 mt-4">
        {/* Counselors */}
        <div className="mb-4 text-center">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">Consejeros Asignados:</span>
            <br />
            {isMobile ? (
              <div className="flex flex-col items-center">
                {counselors.female.id ? (
                  <b>
                    <Link
                      href={`/registro/${counselors.female.id}`}
                      className="text-pink-600 hover:underline"
                    >
                      {counselors.female.name}
                    </Link>
                  </b>
                ) : (
                  <span>{counselors.female.name}</span>
                )}
                <span>-</span>
                {counselors.male.id ? (
                  <b>
                    <Link
                      href={`/registro/${counselors.male.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {counselors.male.name}
                    </Link>
                  </b>
                ) : (
                  <span>{counselors.male.name}</span>
                )}
              </div>
            ) : (
              <p>
                {counselors.female.id ? (
                  <b>
                    <Link
                      href={`/registro/${counselors.female.id}`}
                      className="text-pink-600 hover:underline"
                    >
                      {counselors.female.name}
                    </Link>
                  </b>
                ) : (
                  <span>{counselors.female.name}</span>
                )}
                <span className="mx-2">-</span>
                {counselors.male.id ? (
                  <b>
                    <Link
                      href={`/registro/${counselors.male.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {counselors.male.name}
                    </Link>
                  </b>
                ) : (
                  <span>{counselors.male.name}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Gender tabs */}
        <div className="flex mb-4 border rounded-lg overflow-hidden">
          <button
            ref={maleTabRef}
            className="flex-1 py-2 px-4 flex items-center justify-center gap-2"
            style={{
              backgroundColor: activeTab === "H" ? colors.H.primary : "white",
              color: activeTab === "H" ? "white" : "#334155",
            }}
            onClick={() => handleTabChange("H")}
            disabled={isTransitioning}
          >
            <User className="h-4 w-4" />
            <span>Hombres</span>
            <Badge
              variant={activeTab === "H" ? "secondary" : "outline"}
              className="ml-1"
            >
              {company.maleCount}/{company.maleTotal}
            </Badge>
          </button>
          <button
            ref={femaleTabRef}
            className="flex-1 py-2 px-4 flex items-center justify-center gap-2"
            style={{
              backgroundColor: activeTab === "M" ? colors.M.primary : "white",
              color: activeTab === "M" ? "white" : "#334155",
            }}
            onClick={() => handleTabChange("M")}
            disabled={isTransitioning}
          >
            <User className="h-4 w-4" />
            <span>Mujeres</span>
            <Badge
              variant={activeTab === "M" ? "secondary" : "outline"}
              className="ml-1"
            >
              {company.femaleCount}/{company.femaleTotal}
            </Badge>
          </button>
        </div>

        {/* Members list */}
        <Card
          ref={cardRef}
          className="rounded-xl"
          style={{ borderWidth: "2px", borderColor: currentColors.primary }}
        >
          <CardHeader className="pb-6">
            <CardTitle className="text-lg flex items-center">
              <User
                className="h-5 w-5 mr-2"
                style={{ color: currentColors.primary }}
              />
              {activeTab === "H" ? "Hombres" : "Mujeres"}
              <Badge
                variant="outline"
                className="ml-auto"
                style={{
                  backgroundColor: currentColors.badge,
                  color: currentColors.badgeText,
                  borderColor: "transparent",
                }}
              >
                {activeTab === "H"
                  ? `${company.maleCount}/${company.maleTotal}`
                  : `${company.femaleCount}/${company.femaleTotal}`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent ref={cardContentRef}>
            <div className="space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <Link
                    href={`/registro/${member.id}`}
                    key={member.id}
                    ref={(el) => {
                      memberRefs.current[index] = el;
                    }}
                    className="flex w-full items-start justify-between border-b py-3 last:border-0 last:pb-0 text-left hover:bg-slate-50 transition-colors rounded px-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white focus:ring-slate-300"
                    style={{ opacity: 0 }} // Initial state for GSAP animation
                  >
                    <div className="flex items-center flex-1 min-w-0 mr-2">
                      <Badge
                        variant="outline"
                        className="mr-2 flex-shrink-0"
                        style={{
                          backgroundColor: currentColors.badge,
                          color: currentColors.badgeText,
                          borderColor: "transparent",
                        }}
                      >
                        {member.habitacion}
                      </Badge>
                      <span className="font-medium whitespace-normal break-words">
                        {member.nombres} ({member.edad})
                      </span>
                    </div>
                    <Badge
                      className="border"
                      style={{
                        backgroundColor: "white",
                        color: "#1f2937", // gray-800
                        borderColor: "#e5e7eb", // gray-200
                      }}
                    >
                      {member.estaca}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  No hay miembros registrados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        {/* <div className="flex gap-3 mt-6">
          <Button
            ref={addButtonRef}
            className="flex-1 hover:bg-opacity-90"
            style={
              {
                backgroundColor: currentColors.primary,
                "--hover-bg": currentColors.secondary,
              } as React.CSSProperties
            }
          >
            Añadir Miembro
          </Button>
          <Button variant="outline" className="flex-1">
            Exportar Lista
          </Button>
        </div> */}
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
    </main>
  );
}
