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

type Room = {
  id_habitacion: number; // Nuevo campo para el ID de la habitación
  habitacion: string;
  camas: string;
  registrados: number;
  ocupados: number;
  libres: number;
};

export function RoomSelectionDialog({
  onSelect,
  rooms,
}: {
  onSelect: (room: { id: number; name: string } | null) => void;
  rooms: Room[]; // Array de habitaciones dinámico
}) {
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#F5A962] border-[#015481]/30 text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md"
        >
          Seleccionar Habitación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#9ECC8D] text-[#015481] border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-[#015481] text-xl font-bold">Seleccionar Habitación</DialogTitle>
          <DialogDescription className="text-[#015481]/80 font-medium">
            Elija una habitación basada en la disponibilidad de camas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {rooms.map((room) => (
            <Button
              key={room.id_habitacion} // Usar id_habitacion como key
              variant="outline"
              className={`justify-between ${
                selectedRoom === room.id_habitacion
                  ? "bg-[#2B5F7F] text-white border-[#2B5F7F]"
                  : "bg-white/30 text-[#015481] border-[#015481]/30"
              } hover:bg-[#2B5F7F] hover:text-white font-medium`}
              onClick={() => setSelectedRoom(room.id_habitacion)}
            >
              <span>{room.habitacion}</span>
              <span>
                Ocupadas: {room.ocupados} | Libres:{" "}
                {parseInt(room.camas) - room.ocupados}
              </span>
            </Button>
          ))}
        </div>
        <DialogClose asChild>
          <Button
            className="w-full bg-[#F5A962] text-[#015481] hover:bg-[#F5A962]/80 font-semibold shadow-md disabled:opacity-50"
            onClick={() => {
              if (selectedRoom !== null) {
                const roomData = rooms.find(
                  (r) => r.id_habitacion === selectedRoom
                );
                if (roomData) {
                  onSelect({
                    id: roomData.id_habitacion,
                    name: roomData.habitacion,
                  });
                }
              } else {
                onSelect(null);
              }
            }}
            disabled={selectedRoom === null}
          >
            Confirmar Selección
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
