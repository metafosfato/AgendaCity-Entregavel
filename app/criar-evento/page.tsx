"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, User, MapPin, Music, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import type { User as AuthUser } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  nome: string
  role: "admin" | "cadastrador" | "public"
  status_pedido: "pendente" | "aprovado" | "rejeitado"
  created_at: string
}

interface EventFormData {
  // Dados básicos
  titulo: string
  descricao_evento: string
  local: string
  endereco_completo: string
  tipo_local: string
  datas: string[]
  hora_inicio: string
  hora_fim: string
  estimativa_publico: number | null

  // Promotor
  promotor_nome: string
  promotor_cpf: string
  promotor_telefone: string
  promotor_email: string

  // Características
  musica: boolean
  modalidade_musica: string[]
  fins_lucrativos: boolean
  ingressos: boolean
  fechamento_rua: boolean
  autorizacao_sonora: boolean

  // Links
  instagram_url: string
  link_oficial: string

  // Arquivos
  banner_file: File | null
  foto1_file: File | null
  foto2_file: File | null
  foto3_file: File | null
  requerimento_autorizacao_file: File | null
  projeto_evento_file: File | null
  planta_local_file: File | null
  avcb_bombeiros_file: File | null
  apolice_seguro_file: File | null
  plano_seguranca_file: File | null
  alvara_funcionamento_file: File | null
  autorizacao_sonora_doc_file: File | null
}

const initialFormData: EventFormData = {
  titulo: "",
  descricao_evento: "",
  local: "",
  endereco_completo: "",
  tipo_local: "",
  datas: [],
  hora_inicio: "",
  hora_fim: "",
  estimativa_publico: null,
  promotor_nome: "",
  promotor_cpf: "",
  promotor_telefone: "",
  promotor_email: "",
  musica: false,
  modalidade_musica: [],
  fins_lucrativos: false,
  ingressos: false,
  fechamento_rua: false,
  autorizacao_sonora: false,
  instagram_url: "",
  link_oficial: "",
  banner_file: null,
  foto1_file: null,
  foto2_file: null,
  foto3_file: null,
  requerimento_autorizacao_file: null,
  projeto_evento_file: null,
  planta_local_file: null,
  avcb_bombeiros_file: null,
  apolice_seguro_file: null,
  plano_seguranca_file: null,
  alvara_funcionamento_file: null,
  autorizacao_sonora_doc_file: null,
}

export default function CriarEventoPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [formData, setFormData] = useState<EventFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTab, setCurrentTab] = useState("basico")
  const supabase = createClient()

  useEffect(() => {
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setAuthUser(user)

      if (user) {
        const nome = user.user_metadata?.nome || user.email?.split("@")[0] || "Usuário"
        setUserProfile({
          id: user.id,
          nome,
          role: "cadastrador",
          status_pedido: "aprovado",
          created_at: user.created_at || new Date().toISOString(),
        })
      }

      setLoading(false)
    }

    getInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        const nome = session.user.user_metadata?.nome || session.user.email?.split("@")[0] || "Usuário"
        setUserProfile({
          id: session.user.id,
          nome,
          role: "cadastrador",
          status_pedido: "aprovado",
          created_at: session.user.created_at || new Date().toISOString(),
        })
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!loading && !authUser) {
      redirect("/login")
    }
  }, [authUser, loading])

  useEffect(() => {
    if (userProfile && authUser) {
      // Pré-preencher dados do promotor com dados do usuário
      setFormData((prev) => ({
        ...prev,
        promotor_nome: userProfile.nome,
        promotor_email: authUser.email || "",
      }))
    }
  }, [userProfile, authUser])

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error } = await supabase.storage.from("eventos").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from("eventos").getPublicUrl(fileName)

    return publicUrl
  }

  const validateForm = (): boolean => {
    const requiredFields = [
      "titulo",
      "local",
      "endereco_completo",
      "tipo_local",
      "hora_inicio",
      "hora_fim",
      "promotor_nome",
      "promotor_cpf",
      "promotor_telefone",
      "promotor_email",
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof EventFormData]) {
        toast.error(`Campo obrigatório: ${field.replace("_", " ")}`)
        return false
      }
    }

    if (formData.datas.length === 0) {
      toast.error("Pelo menos uma data deve ser informada")
      return false
    }

    if (formData.hora_inicio >= formData.hora_fim) {
      toast.error("Hora de início deve ser anterior à hora de fim")
      return false
    }

    return true
  }

  const handleSubmit = async (status: "rascunho" | "pendente") => {
    if (!authUser) return

    if (status === "pendente" && !validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Upload de arquivos
      const fileUploads: Record<string, string> = {}

      const fileFields = [
        "banner_file",
        "foto1_file",
        "foto2_file",
        "foto3_file",
        "requerimento_autorizacao_file",
        "projeto_evento_file",
        "planta_local_file",
        "avcb_bombeiros_file",
        "apolice_seguro_file",
        "plano_seguranca_file",
        "alvara_funcionamento_file",
        "autorizacao_sonora_doc_file",
      ]

      for (const field of fileFields) {
        const file = formData[field as keyof EventFormData] as File | null
        if (file) {
          try {
            const url = await uploadFile(file)
            fileUploads[field.replace("_file", "_url")] = url
          } catch (error) {
            console.error(`Erro ao fazer upload de ${field}:`, error)
            toast.error(`Erro ao fazer upload do arquivo: ${field}`)
            return
          }
        }
      }

      // Preparar dados para inserção
      const eventData = {
        user_id: authUser.id,
        titulo: formData.titulo,
        descricao_evento: formData.descricao_evento || null,
        local: formData.local,
        endereco_completo: formData.endereco_completo,
        tipo_local: formData.tipo_local,
        datas: formData.datas,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        estimativa_publico: formData.estimativa_publico,
        promotor_nome: formData.promotor_nome,
        promotor_cpf: formData.promotor_cpf,
        promotor_telefone: formData.promotor_telefone,
        promotor_email: formData.promotor_email,
        musica: formData.musica,
        modalidade_musica: formData.modalidade_musica,
        fins_lucrativos: formData.fins_lucrativos,
        ingressos: formData.ingressos,
        fechamento_rua: formData.fechamento_rua,
        autorizacao_sonora: formData.autorizacao_sonora,
        instagram_url: formData.instagram_url || null,
        link_oficial: formData.link_oficial || null,
        status,
        ...fileUploads,
      }

      const { error } = await supabase.from("eventos").insert([eventData])

      if (error) {
        console.error("Erro ao criar evento:", error)
        toast.error("Erro ao criar evento: " + error.message)
        return
      }

      toast.success(
        status === "rascunho" ? "Rascunho salvo com sucesso!" : "Evento enviado para aprovação com sucesso!",
      )
      router.push("/perfil")
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Erro inesperado ao criar evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (field: keyof EventFormData, file: File | null) => {
    if (file) {
      // Validar tipo de arquivo
      const isImage = field.includes("banner") || field.includes("foto")
      const isDocument = !isImage

      if (isImage && !file.type.startsWith("image/")) {
        toast.error("Apenas arquivos de imagem são permitidos para este campo")
        return
      }

      if (
        isDocument &&
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        toast.error("Apenas arquivos PDF, DOC ou DOCX são permitidos para este campo")
        return
      }

      // Validar tamanho
      const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB para imagens, 10MB para documentos
      if (file.size > maxSize) {
        toast.error(`Arquivo muito grande. Máximo: ${isImage ? "5MB" : "10MB"}`)
        return
      }
    }

    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const addDate = () => {
    const dateInput = document.getElementById("new-date") as HTMLInputElement
    if (dateInput && dateInput.value && !formData.datas.includes(dateInput.value)) {
      setFormData((prev) => ({
        ...prev,
        datas: [...prev.datas, dateInput.value],
      }))
      dateInput.value = ""
    }
  }

  const removeDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      datas: prev.datas.filter((d) => d !== date),
    }))
  }

  const toggleModalidadeMusica = (modalidade: string) => {
    setFormData((prev) => ({
      ...prev,
      modalidade_musica: prev.modalidade_musica.includes(modalidade)
        ? prev.modalidade_musica.filter((m) => m !== modalidade)
        : [...prev.modalidade_musica, modalidade],
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!authUser || !userProfile) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Criar Novo Evento</h1>
          <p className="text-muted-foreground">Preencha as informações do seu evento para solicitar aprovação</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basico">
              <MapPin className="h-4 w-4 mr-2" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="promotor">
              <User className="h-4 w-4 mr-2" />
              Promotor
            </TabsTrigger>
            <TabsTrigger value="caracteristicas">
              <Music className="h-4 w-4 mr-2" />
              Características
            </TabsTrigger>
            <TabsTrigger value="midia">
              <ImageIcon className="h-4 w-4 mr-2" />
              Mídia
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Informações Básicas */}
          <TabsContent value="basico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas do Evento</CardTitle>
                <CardDescription>Dados principais sobre o evento que será realizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="titulo">
                      Título do Evento <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Nome do evento"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descricao">Descrição do Evento</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao_evento}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descricao_evento: e.target.value }))}
                      placeholder="Descreva o evento, suas atividades e objetivos"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="local">
                      Local <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="local"
                      value={formData.local}
                      onChange={(e) => setFormData((prev) => ({ ...prev, local: e.target.value }))}
                      placeholder="Nome do local"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_local">
                      Tipo de Local <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.tipo_local}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_local: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="praca">Praça</SelectItem>
                        <SelectItem value="parque">Parque</SelectItem>
                        <SelectItem value="rua">Rua</SelectItem>
                        <SelectItem value="ginasio">Ginásio</SelectItem>
                        <SelectItem value="centro_cultural">Centro Cultural</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">
                      Endereço Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endereco"
                      value={formData.endereco_completo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endereco_completo: e.target.value }))}
                      placeholder="Endereço completo do evento"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hora_inicio">
                      Hora de Início <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hora_inicio"
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hora_inicio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hora_fim">
                      Hora de Fim <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hora_fim"
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hora_fim: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimativa_publico">Estimativa de Público</Label>
                    <Input
                      id="estimativa_publico"
                      type="number"
                      value={formData.estimativa_publico || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimativa_publico: e.target.value ? Number.parseInt(e.target.value) : null,
                        }))
                      }
                      placeholder="Número estimado de pessoas"
                    />
                  </div>

                  <div>
                    <Label>
                      Datas do Evento <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input id="new-date" type="date" />
                      <Button type="button" onClick={addDate} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.datas.map((date) => (
                        <Badge
                          key={date}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeDate(date)}
                        >
                          {new Date(date).toLocaleDateString("pt-BR")} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dados do Promotor */}
          <TabsContent value="promotor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Promotor</CardTitle>
                <CardDescription>Informações da pessoa responsável pelo evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promotor_nome">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promotor_nome"
                      value={formData.promotor_nome}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promotor_nome: e.target.value }))}
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div>
                    <Label htmlFor="promotor_cpf">
                      CPF <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promotor_cpf"
                      value={formData.promotor_cpf}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promotor_cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="promotor_telefone">
                      Telefone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promotor_telefone"
                      value={formData.promotor_telefone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promotor_telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="promotor_email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promotor_email"
                      type="email"
                      value={formData.promotor_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promotor_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Características */}
          <TabsContent value="caracteristicas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Características do Evento</CardTitle>
                <CardDescription>Detalhes sobre as atividades e necessidades especiais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="musica"
                      checked={formData.musica}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, musica: !!checked }))}
                    />
                    <Label htmlFor="musica">O evento terá música</Label>
                  </div>

                  {formData.musica && (
                    <div className="ml-6 space-y-2">
                      <Label>Modalidades de Música</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {["Ao vivo", "DJ", "Som mecânico", "Banda", "Orquestra", "Outro"].map((modalidade) => (
                          <div key={modalidade} className="flex items-center space-x-2">
                            <Checkbox
                              id={modalidade}
                              checked={formData.modalidade_musica.includes(modalidade)}
                              onCheckedChange={() => toggleModalidadeMusica(modalidade)}
                            />
                            <Label htmlFor={modalidade} className="text-sm">
                              {modalidade}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fins_lucrativos"
                      checked={formData.fins_lucrativos}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, fins_lucrativos: !!checked }))}
                    />
                    <Label htmlFor="fins_lucrativos">Evento com fins lucrativos</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ingressos"
                      checked={formData.ingressos}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ingressos: !!checked }))}
                    />
                    <Label htmlFor="ingressos">Evento com venda de ingressos</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fechamento_rua"
                      checked={formData.fechamento_rua}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, fechamento_rua: !!checked }))}
                    />
                    <Label htmlFor="fechamento_rua">Necessita fechamento de rua</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autorizacao_sonora"
                      checked={formData.autorizacao_sonora}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autorizacao_sonora: !!checked }))}
                    />
                    <Label htmlFor="autorizacao_sonora">Necessita autorização sonora especial</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="instagram_url">Instagram do Evento</Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/evento"
                    />
                  </div>

                  <div>
                    <Label htmlFor="link_oficial">Site Oficial</Label>
                    <Input
                      id="link_oficial"
                      value={formData.link_oficial}
                      onChange={(e) => setFormData((prev) => ({ ...prev, link_oficial: e.target.value }))}
                      placeholder="https://sitedoevento.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mídia */}
          <TabsContent value="midia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagens do Evento</CardTitle>
                <CardDescription>Banner principal e fotos adicionais (máximo 5MB por imagem)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banner">Banner Principal</Label>
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange("banner_file", e.target.files?.[0] || null)}
                    />
                    {formData.banner_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.banner_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="foto1">Foto Adicional 1</Label>
                    <Input
                      id="foto1"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange("foto1_file", e.target.files?.[0] || null)}
                    />
                    {formData.foto1_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.foto1_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="foto2">Foto Adicional 2</Label>
                    <Input
                      id="foto2"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange("foto2_file", e.target.files?.[0] || null)}
                    />
                    {formData.foto2_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.foto2_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="foto3">Foto Adicional 3</Label>
                    <Input
                      id="foto3"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange("foto3_file", e.target.files?.[0] || null)}
                    />
                    {formData.foto3_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.foto3_file.name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Obrigatórios</CardTitle>
                <CardDescription>
                  Documentos necessários para aprovação (PDF, DOC ou DOCX - máximo 10MB cada)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requerimento">Requerimento de Autorização</Label>
                    <Input
                      id="requerimento"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("requerimento_autorizacao_file", e.target.files?.[0] || null)}
                    />
                    {formData.requerimento_autorizacao_file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.requerimento_autorizacao_file.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="projeto">Projeto do Evento</Label>
                    <Input
                      id="projeto"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("projeto_evento_file", e.target.files?.[0] || null)}
                    />
                    {formData.projeto_evento_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.projeto_evento_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="planta">Planta do Local</Label>
                    <Input
                      id="planta"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("planta_local_file", e.target.files?.[0] || null)}
                    />
                    {formData.planta_local_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.planta_local_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="avcb">AVCB dos Bombeiros</Label>
                    <Input
                      id="avcb"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("avcb_bombeiros_file", e.target.files?.[0] || null)}
                    />
                    {formData.avcb_bombeiros_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.avcb_bombeiros_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="apolice">Apólice de Seguro</Label>
                    <Input
                      id="apolice"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("apolice_seguro_file", e.target.files?.[0] || null)}
                    />
                    {formData.apolice_seguro_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.apolice_seguro_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="plano_seguranca">Plano de Segurança</Label>
                    <Input
                      id="plano_seguranca"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("plano_seguranca_file", e.target.files?.[0] || null)}
                    />
                    {formData.plano_seguranca_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.plano_seguranca_file.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="alvara">Alvará de Funcionamento</Label>
                    <Input
                      id="alvara"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("alvara_funcionamento_file", e.target.files?.[0] || null)}
                    />
                    {formData.alvara_funcionamento_file && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.alvara_funcionamento_file.name}</p>
                    )}
                  </div>

                  {formData.autorizacao_sonora && (
                    <div>
                      <Label htmlFor="autorizacao_sonora_doc">Autorização Sonora</Label>
                      <Input
                        id="autorizacao_sonora_doc"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange("autorizacao_sonora_doc_file", e.target.files?.[0] || null)}
                      />
                      {formData.autorizacao_sonora_doc_file && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.autorizacao_sonora_doc_file.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t">
          <Button variant="outline" onClick={() => handleSubmit("rascunho")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar como Rascunho
          </Button>
          <Button onClick={() => handleSubmit("pendente")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar para Aprovação
          </Button>
        </div>
      </div>
    </div>
  )
}
