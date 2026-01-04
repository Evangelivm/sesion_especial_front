"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Shirt,
  Users,
  ChevronDown,
  ChevronUp,
  Heart,
  Building,
  Church,
  Send,
  PhoneCall,
  MessageSquare,
  Droplet,
  AlertCircle,
  Pill,
  FileText,
  Activity,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import RadialMenu from "@/components/radial-menu";
import gsap from "gsap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter, useParams } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es"; // Import the Spanish locale
import {
  buscarParticipanteCompleto,
  getAtencionesByParticipanteId,
} from "@/lib/connections";

// Tipos de datos
interface MedicamentoRecetado {
  frecuencia: string;
  duracion: string;
  inventario_salud: {
    nombre: string;
    descripcion: string;
    dosis: string | null;
  };
}
interface AtencionMedica {
  id_salud: number;
  fecha_consulta: string;
  motivo_consulta: string;
  tratamiento: string;
  seguimiento: number; // 0 o 1
  fecha_seguimiento: string | null;
  datos: {
    id: number;
    nombre_completo: string;
  };
  medicinas_recetadas: MedicamentoRecetado[];
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [participanteData, setParticipanteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [atencionSeleccionada, setAtencionSeleccionada] =
    useState<AtencionMedica | null>(null);
  const [historialAtenciones, setHistorialAtenciones] = useState<
    AtencionMedica[]
  >([]);
  const isMobile = useMobile();

  // Refs for tab content animations
  const personalTabRef = useRef<HTMLDivElement>(null);
  const contactoTabRef = useRef<HTMLDivElement>(null);
  const saludTabRef = useRef<HTMLDivElement>(null);
  const iglesiaTabRef = useRef<HTMLDivElement>(null);
  const atencionesTabRef = useRef<HTMLDivElement>(null);

  // Animation timeline ref
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Radial menu states
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const participante = await buscarParticipanteCompleto(Number(id));
        setParticipanteData(participante);
        const atenciones = await getAtencionesByParticipanteId(Number(id));
        setHistorialAtenciones(atenciones);
      } catch (err) {
        console.error(
          "Error fetching participant data or medical attentions:",
          err
        );
        setError(
          "No se pudo cargar la información del participante o sus atenciones médicas."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  dayjs.extend(utc);
  dayjs.extend(localizedFormat);
  dayjs.locale("es"); // Set dayjs to use the Spanish locale globally

  // Formatear fecha y hora
  const formatearFecha = (
    isoString: string,
    formatType: "short" | "long" = "short",
    useTimezone: boolean = true // Si es false, no aplica conversión de zona horaria
  ) => {
    if (!isoString) return "";
    const date = useTimezone ? dayjs.utc(isoString).local() : dayjs(isoString);
    if (formatType === "long") {
      return date.format("DD [de] MMMM [del] YYYY");
    }
    return date.format("DD/MM/YYYY");
  };
  const formatearHora = (isoString: string) => {
    return dayjs.utc(isoString).local().format("HH:mm");
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (phone.length === 9) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)}`;
    }
    return phone;
  };

  // Format phone number for WhatsApp (international format)
  const formatWhatsAppPhone = (phone: string) => {
    // Assuming Peru country code (+51)
    return `51${phone}`;
  };

  // Initialize tab animations
  useEffect(() => {
    // Set initial states for all tabs
    const tabs = [
      personalTabRef,
      contactoTabRef,
      saludTabRef,
      iglesiaTabRef,
      atencionesTabRef,
    ];

    tabs.forEach((tabRef, index) => {
      if (tabRef.current && index > 0) {
        // Skip the first tab (personal) as it's visible by default
        gsap.set(tabRef.current, {
          opacity: 0,
          x: 20,
          display: "none",
        });
      }
    });

    return () => {
      // Clean up any animations
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  // Handle tab change with GSAP animation
  const handleTabChange = (value: string) => {
    if (value === activeTab) return;

    // Get refs for current and next tabs
    const currentTabRef = getTabRef(activeTab);
    const nextTabRef = getTabRef(value);

    if (!currentTabRef?.current || !nextTabRef?.current) return;

    // Create a new timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setActiveTab(value);
        timelineRef.current = null;
      },
    });

    timelineRef.current = tl;

    // Determine animation direction
    const tabOrder = ["personal", "contacto", "salud", "iglesia", "atenciones"];
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex = tabOrder.indexOf(value);
    const direction = nextIndex > currentIndex ? 1 : -1;

    // Animate out current tab
    tl.to(currentTabRef.current, {
      opacity: 0,
      x: -20 * direction,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        if (currentTabRef.current) {
          currentTabRef.current.style.display = "none";
        }
        if (nextTabRef.current) {
          nextTabRef.current.style.display = "block";
        }
      },
    });

    // Animate in next tab
    tl.fromTo(
      nextTabRef.current,
      {
        opacity: 0,
        x: 20 * direction,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: "power2.out",
      }
    );
  };

  // Helper to get the correct ref based on tab name
  const getTabRef = (tabName: string) => {
    switch (tabName) {
      case "personal":
        return personalTabRef;
      case "contacto":
        return contactoTabRef;
      case "salud":
        return saludTabRef;
      case "iglesia":
        return iglesiaTabRef;
      case "atenciones":
        return atencionesTabRef;
      default:
        return personalTabRef;
    }
  };

  // Radial menu handlers
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setShowMenu(false);

    // Redireccionar según la opción seleccionada
    if (option === "health") {
      router.push("/historial-atenciones");
    }
  };

  const handleMobileMenuOpen = () => {
    // En móviles, posicionamos el menú en el centro de la pantalla
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    setShowMenu(true);
  };

  // Ver detalles de una atención
  const verDetallesAtencion = (atencion: AtencionMedica) => {
    setAtencionSeleccionada(atencion);
  };

  // Ir a nueva atención
  const nuevaAtencion = () => {
    router.push("/atencion-medica");
  };

  // Ir al historial completo
  const verHistorialCompleto = () => {
    router.push("/historial-atenciones");
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

  // Color values based on app/comp/page.tsx
  const colors = {
    male: {
      primary: "#2563eb", // blue-600
      secondary: "#1d4ed8", // blue-700
      badge: "#dbeafe", // blue-100
      badgeText: "#1e40af", // blue-800
    },
    female: {
      primary: "#db2777", // pink-600
      secondary: "#be185d", // pink-700
      badge: "#fce7f3", // pink-100
      badgeText: "#9d174d", // pink-800
    },
  };

  const isFemale = participanteData?.sexo === "M";
  const currentColors = isFemale ? colors.female : colors.male;

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-50 pb-10 relative"
      onContextMenu={!isMobile ? handleRightClick : undefined}
    >
      {/* Header with background */}
      <div
        className="w-full p-6 text-center"
        style={{
          background: `linear-gradient(to right, ${currentColors.primary}, ${currentColors.secondary})`,
        }}
      >
        <h1 className="text-2xl font-bold text-white">
          {loading
            ? "Cargando..."
            : error
            ? "Error"
            : `${participanteData.nombres} ${participanteData.apellidos}`}
        </h1>
        <div className="flex justify-center gap-2 mt-2">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-sm px-3 py-1">
            {loading ? "Cargando..." : error ? "Error" : participanteData.tipo}
          </Badge>
          {!loading && !error && participanteData.dieta === "Si" && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-sm px-3 py-1 font-bold">
              D
            </Badge>
          )}
        </div>
      </div>

      {/* Profile content */}
      <div className="container max-w-md px-4 mt-6">
        {/* ID Badge */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6 grid grid-cols-3 gap-4 items-center">
          <div>
            <p className="text-sm text-slate-500">Compañia</p>
            {loading ? (
              <p className="text-lg font-semibold">Cargando...</p>
            ) : error ? (
              <p className="text-lg font-semibold">Error</p>
            ) : participanteData.compania === "Staff" ? (
              <p className="text-lg font-semibold">
                {participanteData.compania}
              </p>
            ) : (
              <Button
                variant="link"
                className="text-lg font-semibold p-0 h-auto"
                onClick={() => {
                  if (participanteData?.compania) {
                    // Extract company number (e.g., "C8" -> 8)
                    const companyNumber = participanteData.compania.replace("C", "");
                    // Convert to URL id by adding 1 (e.g., C8 -> URL id=9 for Compañía 8)
                    const urlId = Number(companyNumber) + 1;
                    router.push(`/comp/${urlId}`);
                  }
                }}
              >
                {participanteData.compania}
              </Button>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Habitación</p>
            <p className="text-base font-semibold">
              {loading
                ? "Cargando..."
                : error
                ? "Error"
                : participanteData.habitacion}
            </p>
          </div>
          <div className="flex justify-end">
            <Badge
              variant="outline"
              style={{
                backgroundColor:
                  participanteData?.asistio === "Si" ? "#dcfce7" : "#fee2e2", // green-100 or red-100
                color:
                  participanteData?.asistio === "Si" ? "#16a34a" : "#ef4444", // green-600 or red-600
                borderColor: "transparent",
              }}
            >
              {loading
                ? "Cargando..."
                : error
                ? "Error"
                : participanteData.asistio === "Si"
                ? "Asistió"
                : "No Asistió"}
            </Badge>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="salud">Salud</TabsTrigger>
            <TabsTrigger value="iglesia">Iglesia</TabsTrigger>
            <TabsTrigger value="atenciones">Médico</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <div
            ref={personalTabRef}
            className={activeTab === "personal" ? "block" : "hidden"}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User
                    className="h-5 w-5 mr-2"
                    style={{ color: currentColors.primary }}
                  />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {loading || error
                        ? "Cargando..."
                        : participanteData.nacimiento
                        ? "Fecha de Nacimiento"
                        : "Edad"}
                    </p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.nacimiento
                        ? `${formatearFecha(
                            participanteData.nacimiento,
                            "long",
                            false
                          )} (${participanteData.edad} años)`
                        : `${participanteData.edad} años`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Género</p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.sexo === "H"
                        ? "Hombre"
                        : "Mujer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Shirt className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Talla de Ropa
                    </p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.talla}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information Tab */}
          <div
            ref={contactoTabRef}
            className={activeTab === "contacto" ? "block" : "hidden"}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Phone
                    className="h-5 w-5 mr-2"
                    style={{ color: currentColors.primary }}
                  />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-slate-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Teléfono
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-slate-900">
                        {loading
                          ? "Cargando..."
                          : error
                          ? "Error"
                          : formatPhone(participanteData.telefono)}
                      </p>
                      <div className="flex space-x-2">
                        <a
                          href={`tel:${
                            loading || error ? "" : participanteData.telefono
                          }`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          aria-label="Llamar"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${
                            loading || error
                              ? ""
                              : formatWhatsAppPhone(participanteData.telefono)
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          aria-label="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Correo Electrónico
                    </p>
                    <p className="text-slate-900 break-all">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.correo}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between"
                  onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                >
                  <span>Contacto de Emergencia</span>
                  {showEmergencyContact ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showEmergencyContact && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-medium mb-3">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.nom_c1}
                    </h3>

                    <div className="flex items-start">
                      <Phone className="h-4 w-4 text-slate-500 mr-2 mt-1" />
                      <div className="flex-1">
                        <p className="text-slate-900">
                          {loading
                            ? "Cargando..."
                            : error
                            ? "Error"
                            : formatPhone(participanteData.telef_c1)}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          <a
                            href={`tel:${
                              loading || error ? "" : participanteData.telef_c1
                            }`}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                            aria-label="Llamar al contacto de emergencia"
                          >
                            <PhoneCall className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://wa.me/${
                              loading || error
                                ? ""
                                : formatWhatsAppPhone(participanteData.telef_c1)
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                            aria-label="WhatsApp al contacto de emergencia"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {loading || error ? (
                      <p className="text-slate-900">Cargando...</p>
                    ) : (
                      participanteData.correo_c1 !== "-" && (
                        <div className="flex items-center mt-2">
                          <Mail className="h-4 w-4 text-slate-500 mr-2" />
                          <p className="text-slate-900">
                            {participanteData.correo_c1}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Information Tab */}
          <div
            ref={saludTabRef}
            className={activeTab === "salud" ? "block" : "hidden"}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-red-600" />
                  Información de Salud
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-1 flex items-center">
                    <Droplet className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Tipo de Sangre
                      </p>
                      <div className="flex items-center mt-1">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">
                          {loading
                            ? "Cargando..."
                            : error
                            ? "Error"
                            : participanteData.grupo_sang}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Alergia a algún medicamento
                    </p>
                    <p className="text-slate-900 mt-1 text-sm">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.alergia_med ||
                          "No se han registrado alergias"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Pill className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Tratamiento Médico
                    </p>
                    <p className="text-slate-900 mt-1 text-sm">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.trat_med ||
                          "No tiene tratamiento médico actual"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start mt-4">
                  <Activity className="h-5 w-5 text-slate-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Enfermedad Crónica
                    </p>
                    <p className="text-slate-900 mt-1 text-sm">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.enf_cronica || "Ninguna"}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Sección de Alergias */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Alergias</h3>

                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Alergia a alimentos
                      </p>
                      <Badge
                        className={`mt-1 ${
                          participanteData?.alergia_alimento === "Si"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        } border-0`}
                      >
                        {loading
                          ? "Cargando..."
                          : error
                          ? "Error"
                          : participanteData?.alergia_alimento === "Si"
                          ? "Sí"
                          : "No"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Alergia a medicamentos
                      </p>
                      <Badge
                        className={`mt-1 ${
                          participanteData?.alergia_medicamento === "Si"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        } border-0`}
                      >
                        {loading
                          ? "Cargando..."
                          : error
                          ? "Error"
                          : participanteData?.alergia_medicamento === "Si"
                          ? "Sí"
                          : "No"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Alergia a polvo/pelos/ácaros
                      </p>
                      <Badge
                        className={`mt-1 ${
                          participanteData?.alergia_polvo_pelos_acaro === "Si"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        } border-0`}
                      >
                        {loading
                          ? "Cargando..."
                          : error
                          ? "Error"
                          : participanteData?.alergia_polvo_pelos_acaro === "Si"
                          ? "Sí"
                          : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Sección de Dieta */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Dieta Especial</h3>

                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Requiere dieta especial
                      </p>
                      <Badge
                        className={`mt-1 ${
                          participanteData?.dieta === "Si"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        } border-0`}
                      >
                        {loading
                          ? "Cargando..."
                          : error
                          ? "Error"
                          : participanteData?.dieta === "Si"
                          ? "Sí"
                          : "No"}
                      </Badge>
                    </div>
                  </div>

                  {!loading && !error && participanteData?.dieta === "Si" && participanteData?.obs_dieta && (
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-slate-500 mr-3 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500">
                          Observaciones de dieta
                        </p>
                        <p className="text-slate-900 mt-1 text-sm">
                          {participanteData.obs_dieta}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Church Information Tab */}
          <div
            ref={iglesiaTabRef}
            className={activeTab === "iglesia" ? "block" : "hidden"}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Church
                    className="h-5 w-5 mr-2"
                    style={{ color: currentColors.primary }}
                  />
                  Información de la Iglesia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Estaca</p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.estaca}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Barrio</p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.barrio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Miembro
                    </p>
                    <p className="text-slate-900">
                      {loading
                        ? "Cargando..."
                        : error
                        ? "Error"
                        : participanteData.miembro}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Attentions Tab */}
          <div
            ref={atencionesTabRef}
            className={activeTab === "atenciones" ? "block" : "hidden"}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText
                    className="h-5 w-5 mr-2"
                    style={{ color: currentColors.primary }}
                  />
                  Historial de Atenciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {historialAtenciones.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {historialAtenciones.map((atencion) => (
                        <Card
                          key={atencion.id_salud}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => verDetallesAtencion(atencion)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 text-slate-500 mr-1" />
                                  <span className="text-sm text-slate-500">
                                    {formatearFecha(atencion.fecha_consulta)} •{" "}
                                    {formatearHora(atencion.fecha_consulta)}
                                  </span>
                                </div>
                                <h3 className="font-medium mt-1">
                                  {atencion.datos.nombre_completo}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                  {atencion.motivo_consulta}
                                </p>
                                {/* Mostrar fecha de seguimiento en el card si existe */}
                                {atencion.seguimiento === 1 &&
                                  atencion.fecha_seguimiento && (
                                    <div className="flex items-center mt-2 text-sm text-slate-500">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>
                                        Seguimiento:{" "}
                                        {formatearFecha(
                                          atencion.fecha_seguimiento
                                        )}{" "}
                                        •{" "}
                                        {formatearHora(
                                          atencion.fecha_seguimiento
                                        )}
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={verHistorialCompleto}
                    >
                      Ver historial completo
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">
                      No hay atenciones médicas registradas
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={nuevaAtencion}
                    >
                      Registrar nueva atención
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>

        {/* Action buttons */}
        {/* <div className="flex gap-3 mt-6">
          <Button
            className="flex-1"
            style={
              {
                backgroundColor: currentColors.primary,
                "--hover-bg": currentColors.secondary,
              } as React.CSSProperties
            }
          >
            Editar Perfil
          </Button>
          <Button variant="outline" className="flex-1">
            Compartir
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

      {/* Modal de detalles de atención */}
      {atencionSeleccionada && (
        <Dialog
          open={!!atencionSeleccionada}
          onOpenChange={() => setAtencionSeleccionada(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detalles de Atención Médica</DialogTitle>
              <DialogDescription>
                Información completa de la atención registrada.
              </DialogDescription>
            </DialogHeader>
            {atencionSeleccionada && (
              <div className="space-y-4 py-4 text-sm">
                <div>
                  <strong>Participante:</strong>{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-left"
                    onClick={() =>
                      router.push(`/registro/${atencionSeleccionada.datos.id}`)
                    }
                  >
                    {atencionSeleccionada.datos.nombre_completo}
                  </Button>
                </div>
                <p>
                  <strong>Fecha de Consulta:</strong>{" "}
                  {formatearFecha(atencionSeleccionada.fecha_consulta)} a las{" "}
                  {formatearHora(atencionSeleccionada.fecha_consulta)}
                </p>
                <p>
                  <strong>Motivo de Consulta:</strong>{" "}
                  {atencionSeleccionada.motivo_consulta}
                </p>
                <p>
                  <strong>Tratamiento:</strong>{" "}
                  {atencionSeleccionada.tratamiento}
                </p>
                <p>
                  <strong>Seguimiento:</strong>{" "}
                  {atencionSeleccionada.seguimiento === 1 ? `Sí` : "No"}
                </p>
                {/* Mostrar fecha de seguimiento en el dialog si existe */}
                {atencionSeleccionada.seguimiento === 1 &&
                  atencionSeleccionada.fecha_seguimiento && (
                    <p>
                      <strong>Fecha de Seguimiento:</strong>{" "}
                      {formatearFecha(atencionSeleccionada.fecha_seguimiento)} a
                      las{" "}
                      {formatearHora(atencionSeleccionada.fecha_seguimiento)}
                    </p>
                  )}
                {atencionSeleccionada.medicinas_recetadas.length > 0 && (
                  <div>
                    <p className="font-medium mt-2">Medicamentos Recetados:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {atencionSeleccionada.medicinas_recetadas.map(
                        (med, index) => (
                          <li key={index}>
                            {med.inventario_salud.nombre}
                            {med.inventario_salud.dosis &&
                              ` - ${med.inventario_salud.dosis}`}
                            {(med.frecuencia || med.duracion) && " ("}
                            {med.frecuencia && (
                              <>
                                <b>Frecuencia:</b> {med.frecuencia}
                                {med.duracion && ", "}
                              </>
                            )}
                            {med.duracion && (
                              <>
                                <b>Duración:</b> {med.duracion}
                              </>
                            )}
                            {(med.frecuencia || med.duracion) && ")"}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
