import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Definimos el tipo para las compañías
type Company = {
  id_comp: number; // Es un número
  comp: string; // Es una cadena
  hombres: string; // Es una cadena
  mujeres: string; // Es una cadena
};

export function CompanySelectionDialog({
  onSelect,
  comp,
}: {
  onSelect: (company: { id: number; name: string } | null) => void; // selectedCompany será un objeto con id y name
  comp: Company[]; // Array de compañías dinámico
}) {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null); // selectedCompany es un number

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#F5A962] border-[#015481]/30 text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md"
        >
          Seleccionar Compañía
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#9ECC8D] text-[#015481] border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-[#015481] text-xl font-bold">Seleccionar Compañía</DialogTitle>
          <DialogDescription className="text-[#015481]/80 font-medium">
            Elija una compañía basada en la distribución de hombres y mujeres.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {comp.map((company, index) => (
            <Button
              key={index}
              variant="outline"
              className={`justify-between ${
                selectedCompany === company.id_comp
                  ? "bg-[#2B5F7F] text-white border-[#2B5F7F]"
                  : "bg-white/30 text-[#015481] border-[#015481]/30"
              } hover:bg-[#2B5F7F] hover:text-white font-medium`}
              onClick={() => setSelectedCompany(company.id_comp)}
            >
              <span>
                <b>{company.comp}</b>
              </span>
              <span>
                Hombres: {company.hombres} | Mujeres: {company.mujeres}
              </span>
            </Button>
          ))}
        </div>
        <DialogClose asChild>
          <Button
            className="w-full bg-[#F5A962] text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md disabled:opacity-50"
            onClick={() => {
              if (selectedCompany) {
                const company = comp.find(c => c.id_comp === selectedCompany);
                if (company) {
                  onSelect({ id: company.id_comp, name: company.comp });
                }
              }
            }}
            disabled={!selectedCompany}
          >
            Confirmar Selección
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
