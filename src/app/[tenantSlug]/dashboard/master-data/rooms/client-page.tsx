"use client";

import { useState } from "react";
import { DoorOpen, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteRoomAction } from "./actions";
import { EditRoomModal } from "@/components/modals/edit-room-modal";
import { Room } from "@prisma/client";

export default function RoomsClientPage({ rooms, tenantSlug }: { rooms: Room[], tenantSlug: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleDelete = (room: Room) => {
    toast(`Hapus Ruangan "${room.name}"?`, {
      description: "Data ruangan ini akan disembunyikan dari sistem.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(room.id);
          const res = await deleteRoomAction(room.id);
          if (res.error) toast.error(res.error);
          else toast.success("Ruangan berhasil dihapus.");
          setDeletingId(null);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Ruangan</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kapasitas Maksimal</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <DoorOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data ruangan.<br/>Klik "Tambah Ruangan" untuk mulai.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === room.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {room.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span>{room.capacity} Siswa</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setEditingRoom(room)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(room)}
                          disabled={deletingId === room.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingRoom && (
        <EditRoomModal 
          room={editingRoom} 
          tenantSlug={tenantSlug} 
          onClose={() => setEditingRoom(null)} 
        />
      )}
    </>
  );
}
