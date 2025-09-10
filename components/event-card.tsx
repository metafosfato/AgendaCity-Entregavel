"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, Music, DollarSign, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DocumentViewer } from "./document-viewer"
import { useState } from "react"

interface Evento {
  id: string
  titulo: string
  descricao_evento?: string
  local: string
  endereco_completo: string
  datas: string[]
  hora_inicio: string
  hora_fim: string
  estimativa_publico?: number
  promotor_nome: string
  musica: boolean
  fins_lucrativos: boolean
  status: "rascunho" | "pendente" | "aprovado" | "rejeitado"
  banner_url?: string
  created_at: string
  foto1_url?: string
  foto2_url?: string
  foto3_url?: string
  requerimento_autorizacao_url?: string
  projeto_evento_url?: string
  planta_local_url?: string
  avcb_bombeiros_url?: string
  apolice_seguro_url?: string
  plano_seguranca_url?: string
  alvara_funcionamento_url?: string
  autorizacao_sonora_doc_url?: string
}

interface EventCardProps {
  evento: Evento
  showActions?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  showDocuments?: boolean
}

export function EventCard({ evento, showActions = false, onApprove, onReject, showDocuments = false }: EventCardProps) {
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)

  const getStatusBadge = (status: string) => {
    const variants = {
      rascunho: "secondary",
      pendente: "outline",
      aprovado: "default",
      rejeitado: "destructive",
    } as const

    const labels = {
      rascunho: "Rascunho",
      pendente: "Pendente",
      aprovado: "Aprovado",
      rejeitado: "Rejeitado",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":")
      return `${hours}:${minutes}`
    } catch {
      return timeString
    }
  }

  const getDocumentCount = () => {
    const documents = [
      evento.banner_url,
      evento.foto1_url,
      evento.foto2_url,
      evento.foto3_url,
      evento.requerimento_autorizacao_url,
      evento.projeto_evento_url,
      evento.planta_local_url,
      evento.avcb_bombeiros_url,
      evento.apolice_seguro_url,
      evento.plano_seguranca_url,
      evento.alvara_funcionamento_url,
      evento.autorizacao_sonora_doc_url,
    ]
    return documents.filter(Boolean).length
  }

  return (
    <>
      <Card className="w-full">
        {evento.banner_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={evento.banner_url || "/placeholder.svg"}
              alt={evento.titulo}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{evento.titulo}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">Por {evento.promotor_nome}</CardDescription>
            </div>
            {getStatusBadge(evento.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {evento.descricao_evento && (
            <p className="text-sm text-muted-foreground line-clamp-2">{evento.descricao_evento}</p>
          )}

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{evento.local}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{evento.datas.length > 0 ? evento.datas.map(formatDate).join(", ") : "Data não informada"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTime(evento.hora_inicio)} às {formatTime(evento.hora_fim)}
              </span>
            </div>

            {evento.estimativa_publico && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{evento.estimativa_publico} pessoas (estimativa)</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {evento.musica && (
              <Badge variant="outline" className="text-xs">
                <Music className="h-3 w-3 mr-1" />
                Música
              </Badge>
            )}
            {evento.fins_lucrativos && (
              <Badge variant="outline" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Fins Lucrativos
              </Badge>
            )}
            {showDocuments && (
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {getDocumentCount()} documentos
              </Badge>
            )}
          </div>

          {showActions && evento.status === "pendente" && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => onApprove?.(evento.id)} className="flex-1">
                Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject?.(evento.id)} className="flex-1">
                Rejeitar
              </Button>
              {showDocuments && (
                <Button size="sm" variant="outline" onClick={() => setShowDocumentViewer(true)} className="flex-1">
                  <FileText className="h-4 w-4 mr-1" />
                  Ver Documentos
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">Criado em {formatDate(evento.created_at)}</span>
            <div className="flex gap-2">
              {showDocuments && !showActions && (
                <Button size="sm" variant="outline" onClick={() => setShowDocumentViewer(true)}>
                  <FileText className="h-4 w-4 mr-1" />
                  Documentos
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/evento/${evento.id}`}>Ver Detalhes</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDocumentViewer && (
        <DocumentViewer evento={evento} open={showDocumentViewer} onOpenChange={setShowDocumentViewer} />
      )}
    </>
  )
}
