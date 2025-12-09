"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Search, ArrowUpDown, Trash2, ChevronLeft, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/components/ui/use-mobile";
import {
  agregarMedicamento,
  getInventarioMedicamentos,
  eliminarMedicamento,
  actualizarMedicamento,
} from "@/lib/connections";

interface Medication {
  id_inventario_salud: number;
  nombre: string;
  descripcion: string;
  stock: number;
  dosis?: string | null;
}

export default function InventarioMedicamentos() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedicationName, setNewMedicationName] = useState("");
  const [newMedicationDescription, setNewMedicationDescription] = useState("");
  const [newMedicationStock, setNewMedicationStock] = useState(0);
  const [newMedicationIsDose, setNewMedicationIsDose] = useState(false);
  const [newMedicationDose, setNewMedicationDose] = useState("");
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );
  // New states for editing dialog dose condition
  const [editingMedicationIsDose, setEditingMedicationIsDose] = useState(false);
  const [editingMedicationDose, setEditingMedicationDose] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [medicationToDelete, setMedicationToDelete] =
    useState<Medication | null>(null);

  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const inventario = await getInventarioMedicamentos();
        setMedications(inventario as Medication[]);
      } catch (error) {
        console.error("Error al cargar el inventario:", error);
        toast({
          title: "Error",
          description: "Error al cargar el inventario.",
          variant: "destructive",
        });
      }
    };

    fetchMedications();
  }, []);

  const addMedication = async () => {
    if (newMedicationName.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la medicina no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }
    if (newMedicationStock < 0) {
      toast({
        title: "Error",
        description: "El stock no puede ser negativo.",
        variant: "destructive",
      });
      return;
    }
    if (medications.some((med) => med.nombre === newMedicationName.trim())) {
      toast({
        title: "Error",
        description: "Ya existe una medicina con este nombre.",
        variant: "destructive",
      });
      return;
    }

    try {
      await agregarMedicamento(
        newMedicationName.trim(),
        newMedicationDescription.trim(),
        newMedicationStock,
        newMedicationIsDose ? newMedicationDose.trim() : undefined
      );

      toast({
        title: "Éxito",
        description: `"${newMedicationName}" ha sido agregada al inventario.`,
      });
      setNewMedicationName("");
      setNewMedicationDescription("");
      setNewMedicationStock(0);
      setNewMedicationIsDose(false);
      setNewMedicationDose("");
      setIsAddDialogOpen(false);

      // Recargar el inventario
      const inventario = await getInventarioMedicamentos();
      setMedications(inventario as Medication[]);
    } catch (error) {
      console.error("Error al agregar el medicamento:", error);
      toast({
        title: "Error",
        description: "Error al agregar el medicamento.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication);
    // If dosis is non-null and non-empty, set checkbox state to true and load dosis value
    if (medication.dosis && medication.dosis.trim() !== "") {
      setEditingMedicationIsDose(true);
      setEditingMedicationDose(medication.dosis);
    } else {
      setEditingMedicationIsDose(false);
      setEditingMedicationDose("");
    }
    setIsDialogOpen(true);
  };

  const saveEditedMedication = async () => {
    if (editingMedication) {
      if (editingMedication.nombre.trim() === "") {
        toast({
          title: "Error",
          description: "El nombre de la medicina no puede estar vacío.",
          variant: "destructive",
        });
        return;
      }
      if (editingMedication.stock < 0) {
        toast({
          title: "Error",
          description: "El stock no puede ser negativo.",
          variant: "destructive",
        });
        return;
      }
      if (
        medications.some(
          (med) =>
            med.id_inventario_salud !== editingMedication.id_inventario_salud &&
            med.nombre === editingMedication.nombre.trim()
        )
      ) {
        toast({
          title: "Error",
          description: "Ya existe otra medicina con este nombre.",
          variant: "destructive",
        });
        return;
      }
      try {
        await actualizarMedicamento(
          editingMedication.id_inventario_salud,
          editingMedication.nombre.trim(),
          editingMedication.descripcion.trim(),
          editingMedication.stock,
          editingMedicationIsDose ? editingMedicationDose.trim() : null
        );
        // Update the local state after successful update from the server
        setMedications(
          medications.map((med) =>
            med.id_inventario_salud === editingMedication.id_inventario_salud
              ? {
                  ...editingMedication,
                  nombre: editingMedication.nombre.trim(),
                  descripcion: editingMedication.descripcion.trim(),
                  dosis: editingMedicationIsDose
                    ? editingMedicationDose.trim()
                    : null,
                }
              : med
          )
        );
        toast({
          title: "Éxito",
          description: `"${editingMedication.nombre}" ha sido actualizada.`,
        });
        setEditingMedication(null);
        setIsDialogOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al actualizar el medicamento.",
          variant: "destructive",
        });
      }
    }
  };

  const updateMedicationStock = (id: number, newStock: number) => {
    if (newStock < 0) {
      toast({
        title: "Error",
        description: "El stock no puede ser negativo.",
        variant: "destructive",
      });
      return;
    }
    setMedications((prevMedications) =>
      prevMedications.map((med) =>
        med.id_inventario_salud === id ? { ...med, stock: newStock } : med
      )
    );
    toast({
      title: "Stock Actualizado",
      description: `El stock de "${
        medications.find((med) => med.id_inventario_salud === id)?.nombre
      }" ha sido actualizado a ${newStock}.`,
    });
  };

  const handleDeleteClick = (medication: Medication) => {
    setMedicationToDelete(medication);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteMedication = async () => {
    if (medicationToDelete) {
      try {
        await eliminarMedicamento(medicationToDelete.id_inventario_salud);
        setMedications(
          medications.filter(
            (med) =>
              med.id_inventario_salud !== medicationToDelete.id_inventario_salud
          )
        );
        toast({
          title: "Éxito",
          description: `"${medicationToDelete.nombre}" ha sido eliminada del inventario.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar el medicamento.",
          variant: "destructive",
        });
      }
      setMedicationToDelete(null);
      setIsConfirmDialogOpen(false);
    }
  };

  const filteredAndSortedMedications = medications
    .filter((med) =>
      med.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.nombre.localeCompare(b.nombre);
        case "name-desc":
          return b.nombre.localeCompare(a.nombre);
        case "stock-asc":
          return a.stock - b.stock;
        case "stock-desc":
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 pb-10">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center justify-between">
        <div className="flex items-center overflow-hidden">
          <button onClick={() => router.back()} className="text-white mr-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white truncate">
            Inventario de Medicamentos Tópicos
          </h1>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex-shrink-0"
        >
          {isMobile ? "Registrar Nuevo" : "Registrar Nueva Medicina"}
        </Button>
      </div>

      <div className="container max-w-4xl px-4 mt-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicina por nombre..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sortBy" className="sr-only">
              Ordenar por
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="stock-asc">Stock (Asc)</SelectItem>
                <SelectItem value="stock-desc">Stock (Desc)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-4">
            {filteredAndSortedMedications.length > 0 ? (
              filteredAndSortedMedications.map((med) => (
                <div
                  key={med.id_inventario_salud}
                  className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold">{med.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      {med.descripcion || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {med.stock}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosis ? med.dosis : "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(med)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(med)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                No se encontraron medicamentos.
              </p>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inventario de Medicamentos Tópicos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMedications.length > 0 ? (
                    filteredAndSortedMedications.map((med) => (
                      <TableRow key={med.id_inventario_salud}>
                        <TableCell className="font-medium">
                          {med.nombre}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {med.descripcion || "N/A"}
                        </TableCell>
                        <TableCell>{med.stock}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {med.dosis ? med.dosis : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={() => openEditDialog(med)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(med)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No se encontraron medicamentos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby="add-medication-description">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Elemento Tópico</DialogTitle>
            <DialogDescription id="add-medication-description">
              Ingrese los detalles del nuevo elemento tópico.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newMedicationName" className="text-right">
                Nombre
              </Label>
              <Input
                id="newMedicationName"
                value={newMedicationName}
                onChange={(e) => setNewMedicationName(e.target.value)}
                placeholder="Ej. Crema Hidratante"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newMedicationDescription" className="text-right">
                Descripción
              </Label>
              <Input
                id="newMedicationDescription"
                value={newMedicationDescription}
                onChange={(e) => setNewMedicationDescription(e.target.value)}
                placeholder="Ej. Para piel seca y sensible"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newMedicationStock" className="text-right">
                Stock Disponible
              </Label>
              <Input
                id="newMedicationStock"
                type="number"
                value={newMedicationStock}
                onChange={(e) =>
                  setNewMedicationStock(parseInt(e.target.value) || 0)
                }
                min="0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newMedicationIsDose" className="text-right">
                ¿Es de dosis?
              </Label>
              <input
                type="checkbox"
                id="newMedicationIsDose"
                checked={newMedicationIsDose}
                onChange={(e) => setNewMedicationIsDose(e.target.checked)}
                className="col-span-3 h-5 w-5"
              />
            </div>
            {newMedicationIsDose && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newMedicationDose" className="text-right">
                  Dosis
                </Label>
                <Input
                  id="newMedicationDose"
                  value={newMedicationDose}
                  onChange={(e) => setNewMedicationDose(e.target.value)}
                  placeholder="Ej. 5mg"
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addMedication}>Agregar Medicina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby="edit-medication-description">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription id="edit-medication-description">
              Edite los detalles del elemento tópico.
            </DialogDescription>
          </DialogHeader>
          {editingMedication && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="editName"
                  value={editingMedication.nombre}
                  onChange={(e) =>
                    setEditingMedication({
                      ...editingMedication,
                      nombre: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDescription" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="editDescription"
                  value={editingMedication.descripcion}
                  onChange={(e) =>
                    setEditingMedication({
                      ...editingMedication,
                      descripcion: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="editStock"
                  type="number"
                  value={editingMedication.stock}
                  onChange={(e) =>
                    setEditingMedication({
                      ...editingMedication,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                  min="0"
                />
              </div>
              {/* Updated dose condition logic */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editIsDose" className="text-right">
                  ¿Es de dosis?
                </Label>
                <input
                  type="checkbox"
                  id="editIsDose"
                  checked={editingMedicationIsDose}
                  onChange={(e) => setEditingMedicationIsDose(e.target.checked)}
                  className="col-span-3 h-5 w-5"
                />
              </div>
              {editingMedicationIsDose && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDose" className="text-right">
                    Dosis
                  </Label>
                  <Input
                    id="editDose"
                    value={editingMedicationDose}
                    onChange={(e) => setEditingMedicationDose(e.target.value)}
                    placeholder="Ej. 5mg cada 8 horas"
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEditedMedication}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el elemento{" "}
              <span className="font-bold">{medicationToDelete?.nombre}</span> de
              tu inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMedication}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </main>
  );
}
