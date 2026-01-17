import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pvtsesngwilaiqtjdwkr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHNlc25nd2lsYWlxdGpkd2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDI1MjIsImV4cCI6MjA4NDE3ODUyMn0.8MUQ1bbr0oQjtUoIR6K-YKYydI1tgj1QhhdvZE88-Vw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas en espanol
export interface Vendedor {
  id: number
  nombre: string
  telefono: string | null
  correo: string | null
  latitud: number | null
  longitud: number | null
  estado: string
  ultima_actualizacion: string | null
  fecha_creacion: string
}

export interface Visita {
  id: number
  vendedor_id: number
  nombre_cliente: string
  direccion: string | null
  latitud: number | null
  longitud: number | null
  notas: string | null
  tipo_visita: string
  estado: string
  fecha_creacion: string
  fecha_completado: string | null
}

export interface Pedido {
  id: number
  vendedor_id: number
  visita_id: number | null
  nombre_cliente: string
  productos: string | null
  monto_total: number
  estado: string
  fecha_creacion: string
}

export interface Ubicacion {
  id: number
  vendedor_id: number
  latitud: number
  longitud: number
  precision_metros: number | null
  fecha_registro: string
}
