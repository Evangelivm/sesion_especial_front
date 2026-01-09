"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Edad from "./edad";
import Estaca from "./estaca";
import Comproom from "./comproom";
import { registerParticipante } from "@/lib/connections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

interface AdminSettings {
  soloStaff: boolean;
  inscripcionesCerradas: boolean;
}

export default function Page() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [edad, setEdad] = useState<number>(0);
  const [estaca, setEstaca] = useState<number>(0);
  const [barrio, setBarrio] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    soloStaff: false,
    inscripcionesCerradas: false,
  });
  const router = useRouter();

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

  // Solo ejecutar cuando el componente se ha montado en el cliente
  useEffect(() => {
    // Inicializa la fecha de nacimiento y edad solo en el cliente
    setFechaNacimiento("");
    setEdad(0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
      <header className="p-4 bg-[#9ECC8D] shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#015481]">
          FSY Sesion Especial Lima 2026
        </h1>
        <p className="text-center text-sm text-[#015481] font-bold">Anda conmigo</p>
      </header>

      <main className="container mx-auto md:py-4 md:px-20 p-4 space-y-6">
        {adminSettings.inscripcionesCerradas ? (
          <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#015481] text-center">
                Inscripciones Cerradas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-lg text-[#015481] font-semibold">
                Las inscripciones se cerraron, cualquier registro nuevo lo hará el
                personal de registro
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#015481]">Registro de Participante</CardTitle>
              <CardDescription className="text-[#015481]/80">
                Ingresa los datos del participante siguiendo la numeracion de cada
                paso.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apellidos" className="text-[#015481] font-semibold">1. Apellidos</Label>
                <Input
                  id="apellidos"
                  placeholder="Ingrese sus apellidos"
                  className="bg-white/20 border-[#015481]/30 text-[#015481] placeholder:text-[#015481]/60 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombres" className="text-[#015481] font-semibold">2. Nombres</Label>
                <Input
                  id="nombres"
                  placeholder="Ingrese sus nombres"
                  className="bg-white/20 border-[#015481]/30 text-[#015481] placeholder:text-[#015481]/60 font-medium"
                />
              </div>
              <Edad
                initialFecha={fechaNacimiento}
                initialEdad={edad}
                setInitialFecha={setFechaNacimiento}
                setInitialEdad={setEdad}
              />
              <Estaca setEstac={setEstaca} setBarr={setBarrio} />
              <div className="space-y-2">
                <Label htmlFor="sexo" className="text-[#015481] font-semibold">7. Sexo</Label>
                <Select
                  onValueChange={(value) => setGenero(value)} // Actualiza el estado
                >
                  <SelectTrigger className="bg-white/20 border-[#015481]/30 text-[#015481]">
                    <SelectValue placeholder="Seleccione su sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Comproom
                edad={edad}
                genero={genero}
                onSelectCompany={setSelectedCompany}
                onSelectRoom={(room) => setSelectedRoom(room ? room.id : null)}
              />
              {/* Pasamos la edad como prop */}
            </div>
            <Button
              className="w-full mt-6 bg-[#F5A962] text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md"
              onClick={async () => {
                setIsSubmitting(true); // Set loading to true
                const apellidosInput = document.getElementById(
                  "apellidos"
                ) as HTMLInputElement;
                const nombresInput = document.getElementById(
                  "nombres"
                ) as HTMLInputElement;

                const registrationData = {
                  apellido: apellidosInput ? apellidosInput.value : "",
                  nombre: nombresInput ? nombresInput.value : "",
                  nacimiento: fechaNacimiento,
                  edad: edad,
                  sexo: genero,
                  id_estaca: estaca,
                  id_barrio: barrio,
                  id_comp: selectedCompany,
                  id_habitacion: selectedRoom,
                };
                console.log("Datos de registro:", registrationData);

                try {
                  console.log("Attempting to register participant...");
                  await registerParticipante(registrationData);
                  console.log(
                    "Participant registered successfully. Showing success toast."
                  );
                  toast.success("Registro Exitoso", {
                    description:
                      "El participante ha sido registrado correctamente.",
                  });
                  router.refresh(); // Refresh the page
                } catch (error) {
                  console.error("Error al registrar:", error);
                  console.log("Registration failed. Showing error toast.");
                  toast.error("Error en el Registro", {
                    description:
                      "Hubo un problema al registrar el participante. Inténtelo de nuevo.",
                  });
                } finally {
                  setIsSubmitting(false); // Set loading to false
                  console.log(
                    "Submission process finished. Button re-enabled."
                  );
                }
              }}
              disabled={isSubmitting} // Disable button while submitting
            >
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}
