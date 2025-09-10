"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Music,
  DollarSign,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Instagram,
  ExternalLink,
  FileText,
  ImageIcon,
  Download,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { User as AuthUser } from "@supabase/supabase-js"
import { DocumentViewer } from "@/components/document-viewer"

interface Evento {
  id: string
  user_id: string
  titulo: string
  descricao_evento?: string
  local: string
  endereco_completo: string
  tipo_local: string
  datas: string[]
  hora_inicio: string
  hora_fim: string
  estimativa_publico?: number
  promotor_nome: string
  promotor_cpf: string
  promotor_telefone: string
  promotor_email: string
  musica: boolean
  modalidade_musica: string[]
  fins_lucrativos: boolean
  ingressos: boolean
  fechamento_rua: boolean
  autorizacao_sonora: boolean
  instagram_url?: string
  link_oficial?: string
  banner_url?: string
  foto1_url?: string
  foto2_url?: string
  foto3_url?: string
  status: "rascunho" | "pendente" | "aprovado" | "rejeitado"
  created_at: string
  requerimento_autorizacao_url?: string
  projeto_evento_url?: string
  planta_local_url?: string
  avcb_bombeiros_url?: string
  apolice_seguro_url?: string
  plano_seguranca_url?: string
  alvara_funcionamento_url?: string
  autorizacao_sonora_doc_url?: string
}

interface CronogramaItem {
  id: string
  evento_id: string
  data: string
  hora_inicio: string
  hora_fim: string
  atividade: string
  descricao?: string
  local_especifico?: string
  responsavel?: string
  created_at: string
}

export default function EventoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [evento, setEvento] = useState<Evento | null>(null)
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCronograma, setLoadingCronograma] = useState(true)
  const [showCronogramaDialog, setShowCronogramaDialog] = useState(false)
  const [editingCronograma, setEditingCronograma] = useState<CronogramaItem | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const supabase = createClient()

  const [cronogramaForm, setCronogramaForm] = useState({
    data: "",
    hora_inicio: "",
    hora_fim: "",
    atividade: "",
    descricao: "",
    local_especifico: "",
    responsavel: "",
  })

  useEffect(() => {
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setAuthUser(user)
    }

    getInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const fetchEvento = async () => {
      if (!params.id) return

      try {
        const { data, error } = await supabase.from("eventos").select("*").eq("id", params.id).single()

        if (error) {
          console.error("Erro ao buscar evento:", error)
          toast.error("Evento não encontrado")
          router.push("/")
          return
        }

        setEvento(data)
      } catch (error) {
        console.error("Erro inesperado:", error)
        toast.error("Erro ao carregar evento")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchEvento()
  }, [params.id, supabase, router])

  useEffect(() => {
    const fetchCronograma = async () => {
      if (!params.id) return

      try {
        const { data, error } = await supabase
          .from("cronograma_eventos")
          .select("*")
          .eq("evento_id", params.id)
          .order("data", { ascending: true })
          .order("hora_inicio", { ascending: true })

        if (error) {
          console.error("Erro ao buscar cronograma:", error)
          return
        }

        setCronograma(data || [])
      } catch (error) {
        console.error("Erro inesperado:", error)
      } finally {
        setLoadingCronograma(false)
      }
    }

    fetchCronograma()
  }, [params.id, supabase])

  const handleSaveCronograma = async () => {
    if (
      !evento ||
      !cronogramaForm.data ||
      !cronogramaForm.hora_inicio ||
      !cronogramaForm.hora_fim ||
      !cronogramaForm.atividade
    ) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      const cronogramaData = {
        evento_id: evento.id,
        ...cronogramaForm,
      }

      if (editingCronograma) {
        const { error } = await supabase
          .from("cronograma_eventos")
          .update(cronogramaData)
          .eq("id", editingCronograma.id)

        if (error) throw error
        toast.success("Cronograma atualizado com sucesso!")
      } else {
        const { error } = await supabase.from("cronograma_eventos").insert([cronogramaData])

        if (error) throw error
        toast.success("Atividade adicionada ao cronograma!")
      }

      const { data, error } = await supabase
        .from("cronograma_eventos")
        .select("*")
        .eq("evento_id", evento.id)
        .order("data", { ascending: true })
        .order("hora_inicio", { ascending: true })

      if (!error) {
        setCronograma(data || [])
      }

      setShowCronogramaDialog(false)
      setEditingCronograma(null)
      setCronogramaForm({
        data: "",
        hora_inicio: "",
        hora_fim: "",
        atividade: "",
        descricao: "",
        local_especifico: "",
        responsavel: "",
      })
    } catch (error) {
      console.error("Erro ao salvar cronograma:", error)
      toast.error("Erro ao salvar cronograma")
    }
  }

  const handleDeleteCronograma = async (id: string) => {
    try {
      const { error } = await supabase.from("cronograma_eventos").delete().eq("id", id)

      if (error) throw error

      setCronograma(cronograma.filter((item) => item.id !== id))
      toast.success("Atividade removida do cronograma!")
    } catch (error) {
      console.error("Erro ao deletar cronograma:", error)
      toast.error("Erro ao remover atividade")
    }
  }

  const openEditCronograma = (item: CronogramaItem) => {
    setEditingCronograma(item)
    setCronogramaForm({
      data: item.data,
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
      atividade: item.atividade,
      descricao: item.descricao || "",
      local_especifico: item.local_especifico || "",
      responsavel: item.responsavel || "",
    })
    setShowCronogramaDialog(true)
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

  const isOwner = authUser && evento && authUser.id === evento.user_id

  const getDocumentCount = () => {
    if (!evento) return 0
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>O evento que você está procurando não existe ou foi removido.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          {isOwner && (
            <Dialog open={showCronogramaDialog} onOpenChange={setShowCronogramaDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  ADC. CRONOGRAMA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCronograma ? "Editar Atividade" : "Adicionar Atividade"}</DialogTitle>
                  <DialogDescription>
                    {editingCronograma
                      ? "Edite os detalhes da atividade"
                      : "Adicione uma nova atividade ao cronograma do evento"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data">Data *</Label>
                      <Select
                        value={cronogramaForm.data}
                        onValueChange={(value) => setCronogramaForm({ ...cronogramaForm, data: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a data" />
                        </SelectTrigger>
                        <SelectContent>
                          {evento.datas.map((data) => (
                            <SelectItem key={data} value={data}>
                              {formatDate(data)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="atividade">Atividade *</Label>
                      <Input
                        id="atividade"
                        value={cronogramaForm.atividade}
                        onChange={(e) => setCronogramaForm({ ...cronogramaForm, atividade: e.target.value })}
                        placeholder="Nome da atividade"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hora_inicio">Hora Início *</Label>
                      <Input
                        id="hora_inicio"
                        type="time"
                        value={cronogramaForm.hora_inicio}
                        onChange={(e) => setCronogramaForm({ ...cronogramaForm, hora_inicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hora_fim">Hora Fim *</Label>
                      <Input
                        id="hora_fim"
                        type="time"
                        value={cronogramaForm.hora_fim}
                        onChange={(e) => setCronogramaForm({ ...cronogramaForm, hora_fim: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={cronogramaForm.descricao}
                      onChange={(e) => setCronogramaForm({ ...cronogramaForm, descricao: e.target.value })}
                      placeholder="Descrição da atividade"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="local_especifico">Local Específico</Label>
                      <Input
                        id="local_especifico"
                        value={cronogramaForm.local_especifico}
                        onChange={(e) => setCronogramaForm({ ...cronogramaForm, local_especifico: e.target.value })}
                        placeholder="Ex: Palco Principal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsavel">Responsável</Label>
                      <Input
                        id="responsavel"
                        value={cronogramaForm.responsavel}
                        onChange={(e) => setCronogramaForm({ ...cronogramaForm, responsavel: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveCronograma} className="flex-1">
                      {editingCronograma ? "Atualizar" : "Adicionar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCronogramaDialog(false)
                        setEditingCronograma(null)
                        setCronogramaForm({
                          data: "",
                          hora_inicio: "",
                          hora_fim: "",
                          atividade: "",
                          descricao: "",
                          local_especifico: "",
                          responsavel: "",
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {evento.banner_url && (
          <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
            <img
              src={evento.banner_url || "/placeholder.svg"}
              alt={evento.titulo}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{evento.titulo}</CardTitle>
                <CardDescription className="text-lg">Por {evento.promotor_nome}</CardDescription>
              </div>
              {getStatusBadge(evento.status)}
            </div>
            {evento.descricao_evento && <p className="text-muted-foreground mt-4">{evento.descricao_evento}</p>}
          </CardHeader>
        </Card>

        <Tabs defaultValue="detalhes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma ({cronograma.length})</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="documentos">Documentos ({getDocumentCount()})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{evento.local}</p>
                      <p className="text-sm text-muted-foreground">{evento.endereco_completo}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {evento.tipo_local}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Datas do Evento</p>
                      <p className="text-sm text-muted-foreground">{evento.datas.map(formatDate).join(", ")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(evento.hora_inicio)} às {formatTime(evento.hora_fim)}
                      </p>
                    </div>
                  </div>

                  {evento.estimativa_publico && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Público Estimado</p>
                        <p className="text-sm text-muted-foreground">{evento.estimativa_publico} pessoas</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Características</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {evento.musica && (
                      <Badge variant="outline">
                        <Music className="h-3 w-3 mr-1" />
                        Música
                      </Badge>
                    )}
                    {evento.fins_lucrativos && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Fins Lucrativos
                      </Badge>
                    )}
                    {evento.ingressos && <Badge variant="outline">Venda de Ingressos</Badge>}
                    {evento.fechamento_rua && <Badge variant="outline">Fechamento de Rua</Badge>}
                    {evento.autorizacao_sonora && <Badge variant="outline">Autorização Sonora</Badge>}
                  </div>

                  {evento.modalidade_musica.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Modalidades Musicais</p>
                      <div className="flex flex-wrap gap-1">
                        {evento.modalidade_musica.map((modalidade, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {modalidade}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(evento.instagram_url || evento.link_oficial) && (
                    <div>
                      <p className="font-medium mb-2">Links</p>
                      <div className="space-y-2">
                        {evento.instagram_url && (
                          <a
                            href={evento.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <Instagram className="h-4 w-4" />
                            Instagram
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {evento.link_oficial && (
                          <a
                            href={evento.link_oficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Site Oficial
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {(evento.foto1_url || evento.foto2_url || evento.foto3_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fotos do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[evento.foto1_url, evento.foto2_url, evento.foto3_url].filter(Boolean).map((url, index) => (
                      <div key={index} className="aspect-video overflow-hidden rounded-lg">
                        <img
                          src={url! || "/placeholder.svg"}
                          alt={`Foto ${index + 1} do evento`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cronograma" className="space-y-6">
            {loadingCronograma ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando cronograma...</p>
                  </div>
                </CardContent>
              </Card>
            ) : cronograma.length > 0 ? (
              <div className="space-y-4">
                {evento.datas.map((data) => {
                  const atividadesDaData = cronograma.filter((item) => item.data === data)

                  if (atividadesDaData.length === 0) return null

                  return (
                    <Card key={data}>
                      <CardHeader>
                        <CardTitle className="text-lg">{formatDate(data)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {atividadesDaData.map((item) => (
                            <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {formatTime(item.hora_inicio)} - {formatTime(item.hora_fim)}
                                  </span>
                                  <Badge variant="outline">{item.atividade}</Badge>
                                </div>
                                {item.descricao && (
                                  <p className="text-sm text-muted-foreground mb-1">{item.descricao}</p>
                                )}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  {item.local_especifico && <span>📍 {item.local_especifico}</span>}
                                  {item.responsavel && <span>👤 {item.responsavel}</span>}
                                </div>
                              </div>
                              {isOwner && (
                                <div className="flex gap-1 ml-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditCronograma(item)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteCronograma(item.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Cronograma não disponível</CardTitle>
                  <CardDescription>
                    {isOwner
                      ? "Adicione atividades ao cronograma do seu evento usando o botão 'ADC. CRONOGRAMA'."
                      : "O organizador ainda não definiu o cronograma deste evento."}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contato" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Promotor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{evento.promotor_nome}</p>
                    <p className="text-sm text-muted-foreground">CPF: {evento.promotor_cpf}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{evento.promotor_telefone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-sm text-muted-foreground">{evento.promotor_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Documentos do Evento</CardTitle>
                    <CardDescription>
                      {isOwner ? "Documentos enviados para aprovação do evento" : "Documentos disponíveis publicamente"}
                    </CardDescription>
                  </div>
                  {getDocumentCount() > 0 && (
                    <Button onClick={() => setShowDocumentViewer(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Todos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getDocumentCount() > 0 ? (
                  <div className="space-y-6">
                    {(evento.banner_url || evento.foto1_url || evento.foto2_url || evento.foto3_url) && (
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Imagens (
                          {
                            [evento.banner_url, evento.foto1_url, evento.foto2_url, evento.foto3_url].filter(Boolean)
                              .length
                          }
                          )
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { url: evento.banner_url, label: "Banner" },
                            { url: evento.foto1_url, label: "Foto 1" },
                            { url: evento.foto2_url, label: "Foto 2" },
                            { url: evento.foto3_url, label: "Foto 3" },
                          ]
                            .filter((item) => item.url)
                            .map(({ url, label }, index) => (
                              <div key={index} className="group relative">
                                <div className="aspect-square overflow-hidden rounded-lg border">
                                  <img
                                    src={url! || "/placeholder.svg"}
                                    alt={label}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setShowDocumentViewer(true)}>
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="secondary" asChild>
                                      <a href={url!} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-center mt-1 text-muted-foreground">{label}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos Legais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: "requerimento_autorizacao_url", label: "Requerimento de Autorização", required: true },
                          { key: "projeto_evento_url", label: "Projeto do Evento", required: true },
                          { key: "planta_local_url", label: "Planta do Local", required: true },
                          { key: "avcb_bombeiros_url", label: "AVCB Bombeiros", required: true },
                          { key: "apolice_seguro_url", label: "Apólice de Seguro", required: true },
                          { key: "plano_seguranca_url", label: "Plano de Segurança", required: true },
                          { key: "alvara_funcionamento_url", label: "Alvará de Funcionamento", required: false },
                          { key: "autorizacao_sonora_doc_url", label: "Autorização Sonora", required: false },
                        ].map(({ key, label, required }) => {
                          const url = evento[key as keyof Evento] as string

                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between p-3 border rounded-lg ${
                                url
                                  ? "bg-green-50 border-green-200"
                                  : required
                                    ? "bg-red-50 border-red-200"
                                    : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FileText
                                  className={`h-4 w-4 ${url ? "text-green-600" : required ? "text-red-600" : "text-gray-400"}`}
                                />
                                <div>
                                  <span className="text-sm font-medium">{label}</span>
                                  {required && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Obrigatório
                                    </Badge>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {url ? "✅ Anexado" : required ? "❌ Faltando" : "⚪ Opcional"}
                                  </div>
                                </div>
                              </div>
                              {url && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setShowDocumentViewer(true)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={url} download target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Nenhum documento disponível</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner
                        ? "Você ainda não enviou documentos para este evento."
                        : "O organizador ainda não enviou documentos para este evento."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {evento && showDocumentViewer && (
          <DocumentViewer evento={evento} open={showDocumentViewer} onOpenChange={setShowDocumentViewer} />
        )}
      </div>
    </div>
  )
}
