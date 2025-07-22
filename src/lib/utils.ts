import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getStatusColor(status: string) {
  const colors = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'rejeitada': 'bg-red-100 text-red-800',
    'separando': 'bg-blue-100 text-blue-800',
    'entregue': 'bg-green-100 text-green-800',
    'confirmada': 'bg-gray-100 text-gray-800',
    'solicitado': 'bg-yellow-100 text-yellow-800',
    'separado': 'bg-blue-100 text-blue-800',
    'em_falta': 'bg-red-100 text-red-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getPriorityColor(priority: string) {
  const colors = {
    'baixa': 'bg-green-100 text-green-800',
    'normal': 'bg-blue-100 text-blue-800',
    'alta': 'bg-orange-100 text-orange-800',
    'urgente': 'bg-red-100 text-red-800',
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getJanelaEntrega() {
  const now = new Date()
  const hour = now.getHours()
  
  // Se for antes das 14h, entrega na manhã do próximo dia
  // Se for depois das 14h, entrega na tarde do próximo dia
  return hour < 14 ? 'manha' : 'tarde'
}