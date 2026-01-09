"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, LogOut } from "lucide-react";
import {
  getParticipantes,
  buscarParticipante,
  loginAdmin,
  logoutAdmin,
  validateAdminToken,
  updateAdminSettings,
} from "@/lib/connections";
import { ResultadosParticipante } from "../result";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

interface AdminSettings {
  soloStaff: boolean;
  inscripcionesCerradas: boolean;
}

interface User {
  id: number;
  username: string;
  nombre: string;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin settings state
  const [settings, setSettings] = useState<AdminSettings>({
    soloStaff: false,
    inscripcionesCerradas: false,
  });

  // Asistencia state
  const [participantes, setParticipantes] = useState<{ id: number; name: string; tipo: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [participanteInfo, setParticipanteInfo] = useState<any>(null);

  // Validar token al cargar la página
  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    if (storedToken) {
      validateToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await validateAdminToken(tokenToValidate);
      setIsAuthenticated(true);
      setUser(response.user);
      setToken(tokenToValidate);
    } catch (error) {
      console.error("Token inválido:", error);
      localStorage.removeItem("admin_token");
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize WebSocket connection for settings
  useEffect(() => {
    let hasInitialConnection = false;

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      socket.emit("subscribeToAdminSettings");

      // Notificar reconexión (solo si no es la primera conexión)
      if (hasInitialConnection) {
        toast.success("Conexión en tiempo real restablecida");
      }
      hasInitialConnection = true;
    });

    socket.on("disconnect", () => {
      console.warn("WebSocket desconectado");
      toast.warning("Conexión en tiempo real perdida");
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión de WebSocket:", err);
    });

    socket.on("admin-settings", (message: string) => {
      console.log("Received admin settings update:", message);
      try {
        const updatedSettings = JSON.parse(message);
        setSettings(updatedSettings);
        toast.info("Configuración actualizada");
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

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/admin/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching admin settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch participantes (solo si autenticado)
  useEffect(() => {
    if (isAuthenticated) {
      const fetchParticipantes = async () => {
        try {
          const data = await getParticipantes();
          setParticipantes(data);
        } catch (error) {
          console.error("Error fetching participantes:", error);
        }
      };

      fetchParticipantes();
    }
  }, [isAuthenticated]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await loginAdmin(username, password);

      if (response.success) {
        localStorage.setItem("admin_token", response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success(`Bienvenido, ${response.user.nombre}`);
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      toast.error(error.response?.data?.message || "Usuario o contraseña incorrectos");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!token) return;

    try {
      await logoutAdmin(token);
      localStorage.removeItem("admin_token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Limpiar de todas formas
      localStorage.removeItem("admin_token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Handle settings change
  const handleSettingChange = async (key: keyof AdminSettings, value: boolean) => {
    if (!token) {
      toast.error("No autenticado");
      return;
    }

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      await updateAdminSettings(token, updatedSettings);
      toast.success("Configuración actualizada correctamente");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error al actualizar configuración");
      // Revert the change
      setSettings(settings);
    }
  };

  // Handle asistencia search
  const handleSelect = (id: number) => {
    if (id !== 0) {
      setSelectedId(id);
    }
  };

  const handleBuscar = async () => {
    if (selectedId !== null) {
      try {
        const data = await buscarParticipante(selectedId);
        setParticipanteInfo(data);
      } catch (error) {
        console.error("Error buscando participante:", error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] flex items-center justify-center">
        <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
          <CardContent className="p-8">
            <p className="text-[#015481] font-semibold">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login form (si no está autenticado)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
        <header className="p-4 bg-[#9ECC8D] shadow-lg">
          <h1 className="text-2xl font-bold text-center text-[#015481]">
            Panel de Administración
          </h1>
          <p className="text-center text-sm mt-1 font-bold text-[#015481]">
            Iniciar sesión
          </p>
        </header>

        <main className="container mx-auto p-4 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/15 backdrop-blur border-none shadow-lg max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-[#2B5F7F] text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-[#015481]/80 text-center">
                Ingrese sus credenciales de administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#015481] font-semibold">
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    className="bg-white/20 border-[#015481]/30 text-[#015481] placeholder:text-[#015481]/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#015481] font-semibold">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    className="bg-white/20 border-[#015481]/30 text-[#015481] placeholder:text-[#015481]/60"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#F5A962] text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Panel de administración (si está autenticado)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9ECC8D] via-[#B4DABD] to-[#CAE9EF] text-gray-800">
      <header className="p-4 bg-[#9ECC8D] shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Spacer invisible para balancear el layout en desktop */}
          <div className="hidden md:block w-32"></div>

          {/* Título centrado */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-[#015481]">
              Panel de Administración
            </h1>
            <p className="text-sm mt-1 font-bold text-[#015481]">
              Bienvenido, {user?.nombre}
            </p>
          </div>

          {/* Botón de logout */}
          <div className="md:w-32 flex justify-end">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#015481] text-[#015481] hover:bg-[#015481]/10"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-6xl">
        {/* Settings Section */}
        <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2B5F7F]">Configuración General</CardTitle>
            <CardDescription className="text-[#015481]/80">
              Controla el acceso y las inscripciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-[#015481] font-semibold">Modo Solo Staff</Label>
                <p className="text-sm text-[#015481]/70">
                  Solo muestra participantes de tipo Staff en la página principal
                </p>
              </div>
              <Switch
                checked={settings.soloStaff}
                onCheckedChange={(checked) => handleSettingChange("soloStaff", checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-[#015481] font-semibold">Cerrar Inscripciones</Label>
                <p className="text-sm text-[#015481]/70">
                  Impide nuevos registros de participantes (solo admins pueden registrar)
                </p>
              </div>
              <Switch
                checked={settings.inscripcionesCerradas}
                onCheckedChange={(checked) =>
                  handleSettingChange("inscripcionesCerradas", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Asistencia Section */}
        <Card className="bg-white/15 backdrop-blur border-none shadow-lg relative z-10">
          <CardHeader>
            <CardTitle className="text-[#2B5F7F]">
              <Search className="inline-block mr-2 h-5 w-5" />
              Marcar Asistencia
            </CardTitle>
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

            {participanteInfo && (
              <div className="mt-4 relative z-20">
                <ResultadosParticipante
                  participanteInfo={participanteInfo}
                  onAsistenciaConfirmada={handleBuscar}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Section */}
        <Card className="bg-white/15 backdrop-blur border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2B5F7F]">
              <UserPlus className="inline-block mr-2 h-5 w-5" />
              Registrar Nuevo Participante
            </CardTitle>
            <CardDescription className="text-[#015481]/80">
              Para registrar un nuevo participante, por favor dirígete a la{" "}
              <a href="/register" className="underline font-semibold">
                página de registro
              </a>
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
