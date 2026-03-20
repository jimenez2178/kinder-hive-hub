"use client";

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";

interface TelegramLinkProps {
    userId: string;
    initialTelegramId?: string;
}

export default function TelegramLink({ userId, initialTelegramId = '' }: TelegramLinkProps) {
  const [telegramId, setTelegramId] = useState(initialTelegramId);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSaveTelegram = async () => {
    if (!telegramId) {
      alert("Por favor, ingresa tu ID de Telegram.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ telegram_chat_id: telegramId })
        .eq("id", userId);

      if (error) throw error;
      
      alert("¡ID de Telegram vinculado con éxito! Ya puedes recibir alertas de seguridad.");
    } catch (error: any) {
      console.error("Error al vincular Telegram:", error);
      alert("Error al vincular Telegram: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 mt-6 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="relative z-10">
        <h3 className="font-black text-indigo-900 flex items-center gap-3 italic uppercase tracking-tighter text-xl">
          <Send className="text-indigo-600 h-6 w-6" /> Alertas de Seguridad (Telegram)
        </h3>
        <p className="text-sm text-indigo-700/70 mt-3 mb-6 font-medium leading-relaxed">
          Pega tu ID de Telegram (obtenido de <span className="font-bold text-indigo-900">@userinfobot</span>) para recibir avisos de asistencia y salida en tiempo real.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input 
              type="text" 
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Ej: 123456789"
              className="w-full bg-white px-6 py-4 rounded-[24px] border-2 border-transparent ring-2 ring-indigo-100 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all font-bold text-indigo-900 placeholder:text-indigo-200"
            />
          </div>
          <button 
            onClick={handleSaveTelegram}
            disabled={loading}
            className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? 'Vinculando...' : 'Vincular ID'}
            {!loading && <CheckCircle2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
