"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id_estaca: number;
  estaca: string;
}

interface SubOption {
  id_barrio: number;
  barrio: string;
}

interface EstacaProps {
  setEstac: (estac: number) => void;
  setBarr: (barr: number) => void;
}

function Estaca({ setEstac, setBarr }: EstacaProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [selectedEstaca, setSelectedEstaca] = useState<number | null>(null);
  const [active, setActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga

  // Fetch initial options
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_HTTP_URL}/estaca`)
      .then((response) => {
        setOptions(response.data);
        setLoading(false); // Cambiar a false cuando los datos estén listos
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false); // En caso de error, también cambiar a false
      });
  }, []);

  // Fetch sub-options based on selected option
  useEffect(() => {
    if (selectedEstaca !== null) {
      axios
        .get(`${process.env.NEXT_PUBLIC_HTTP_URL}/estaca/${selectedEstaca}`)
        .then((response) => {
          setSubOptions(response.data);
        })
        .catch((error) => {
          console.error("Error fetching sub-options:", error);
        });
    }
  }, [selectedEstaca]);

  const handleEstacaChange = (value: string) => {
    const numEstaca = parseInt(value);
    setEstac(numEstaca);
    setSelectedEstaca(numEstaca);
    setActive(false);
  };

  const handleBarrioChange = (value: string) => {
    const numBarrio = parseInt(value);
    setBarr(numBarrio);
  };

  if (loading) {
    return <div className="text-md text-[#015481] font-semibold">Cargando Estacas y Barrios...</div>; // Mostrar un loading hasta que los datos estén listos
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="estaca" className="text-[#015481] font-semibold">5. Estaca</Label>
        <Select onValueChange={handleEstacaChange}>
          <SelectTrigger className="bg-white/20 border-[#015481]/30 text-[#015481]">
            <SelectValue placeholder="Seleccione la estaca" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) =>
              option &&
              option.id_estaca !== undefined &&
              option.id_estaca !== null ? (
                <SelectItem
                  key={option.id_estaca}
                  value={option.id_estaca.toString()}
                >
                  {option.estaca}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unidad" className="text-[#015481] font-semibold">6. Barrio</Label>
        <Select onValueChange={handleBarrioChange} disabled={active}>
          <SelectTrigger className="bg-white/20 border-[#015481]/30 text-[#015481]">
            <SelectValue placeholder="Seleccione el barrio o rama" />
          </SelectTrigger>
          <SelectContent>
            {subOptions.map((subOption) =>
              subOption &&
              subOption.id_barrio !== undefined &&
              subOption.id_barrio !== null ? (
                <SelectItem
                  key={subOption.id_barrio}
                  value={subOption.id_barrio.toString()}
                >
                  {subOption.barrio}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export default Estaca;
