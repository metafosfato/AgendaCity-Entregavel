"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/event-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import type { User as AuthUser } from "@supabase/supabase-js"

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
  user_id: string
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

interface User {
  id: string
  nome: string
  role: "admin" | "cadastrador" | "public"
  status_pedido: "pendente" | "aprovado" | "rejeitado"
  created_at: string
}

interface UserProfile {
  id: string
  nome: string
  role: "admin" | "cadastrador" | "public"
  status_pedido: "pendente" | "aprovado" | "rejeitado"
  created_at: string
}

interface UserWithAuth extends User {
  auth_user: { email: string }
}

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [users, setUsers] = useState<UserWithAuth[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [stats, setStats] = useState({
    totalEventos: 0,
    eventosPendentes: 0,
    eventosAprovados: 0,
    eventosRejeitados: 0,
    totalUsuarios: 0,
    usuariosPendentes: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setAuthUser(user)

      if (user) {
        const { data: userProfile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Erro ao buscar perfil do usuário:", error)
          setUserProfile(null)
        } else {
          setUserProfile(userProfile)
        }
      }

      setLoading(false)
    }

    getInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null)

      if (session?.user) {
        const { data: userProfile, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (error) {
          console.error("Erro ao buscar perfil do usuário:", error)
          setUserProfile(null)
        } else {
          setUserProfile(userProfile)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!loading && (!authUser || !userProfile || userProfile.role !== "admin")) {
      redirect("/")
    }
  }, [authUser, userProfile, loading])

  useEffect(() => {
    if (userProfile?.role === "admin") {
      const fetchData = async () => {
        if (!authUser || userProfile?.role !== "admin") return

        try {
          const { data: eventosData, error: eventosError } = await supabase
            .from("eventos")
            .select("*")
            .order("created_at", { ascending: false })

          if (eventosError) {
            console.error("Erro ao buscar eventos:", eventosError)
            toast.error("Erro ao carregar eventos")
          } else {
            setEventos(eventosData || [])
          }

          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false })

          if (usersError) {
            console.error("Erro ao buscar usuários:", usersError)
            toast.error("Erro ao carregar usuários")
          } else {
            const usersWithAuth =
              usersData?.map((user) => ({
                ...user,
                auth_user: { email: "user@example.com" },
              })) || []
            setUsers(usersWithAuth)
          }

          if (eventosData && usersData) {
            setStats({
              totalEventos: eventosData.length,
              eventosPendentes: eventosData.filter((e) => e.status === "pendente").length,
              eventosAprovados: eventosData.filter((e) => e.status === "aprovado").length,
              eventosRejeitados: eventosData.filter((e) => e.status === "rejeitado").length,
              totalUsuarios: usersData.length,
              usuariosPendentes: usersData.filter((u) => u.status_pedido === "pendente").length,
            })
          }
        } catch (error) {
          console.error("Erro inesperado:", error)
          toast.error("Erro inesperado ao carregar dados")
        } finally {
          setLoadingData(false)
        }
      }

      fetchData()
    }
  }, [authUser, userProfile, supabase])

  const handleEventAction = async (eventId: string, action: "aprovado" | "rejeitado") => {
    console.log("[v0] Iniciando aprovação/rejeição do evento:", eventId, "ação:", action)

    try {
      const { error } = await supabase.from("eventos").update({ status: action }).eq("id", eventId)

      if (error) {
        console.error("[v0] Erro ao atualizar evento:", error)
        toast.error("Erro ao atualizar status do evento")
        return
      }

      console.log("[v0] Evento atualizado com sucesso no banco de dados")

      setEventos((prev) => prev.map((evento) => (evento.id === eventId ? { ...evento, status: action } : evento)))

      console.log("[v0] Estado local atualizado")

      setStats((prev) => ({
        ...prev,
        eventosPendentes: prev.eventosPendentes - 1,
        eventosAprovados: action === "aprovado" ? prev.eventosAprovados + 1 : prev.eventosAprovados,
        eventosRejeitados: action === "rejeitado" ? prev.eventosRejeitados + 1 : prev.eventosRejeitados,
      }))

      console.log("[v0] Estatísticas atualizadas")

      toast.success(`Evento ${action === "aprovado" ? "aprovado" : "rejeitado"} com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro inesperado:", error)
      toast.error("Erro inesperado ao atualizar evento")
    }
  }

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

      if (error) {
        console.error("Erro ao atualizar role:", error)
        toast.error("Erro ao atualizar role do usuário")
        return
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole as any } : user)))

      toast.success("Role do usuário atualizada com sucesso!")
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Erro inesperado ao atualizar usuário")
    }
  }

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("users").update({ status_pedido: newStatus }).eq("id", userId)

      if (error) {
        console.error("Erro ao atualizar status:", error)
        toast.error("Erro ao atualizar status do usuário")
        return
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status_pedido: newStatus as any } : user)))

      if (newStatus !== "pendente") {
        setStats((prev) => ({
          ...prev,
          usuariosPendentes: prev.usuariosPendentes - 1,
        }))
      }

      toast.success("Status do usuário atualizado com sucesso!")
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Erro inesperado ao atualizar usuário")
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!authUser || !userProfile || userProfile.role !== "admin") {
    return null
  }

  const eventosPendentes = eventos.filter((e) => e.status === "pendente")
  const eventosAprovados = eventos.filter((e) => e.status === "aprovado")
  const eventosRejeitados = eventos.filter((e) => e.status === "rejeitado")
  const usuariosPendentes = users.filter((u) => u.status_pedido === "pendente")

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      aprovado: "default",
      rejeitado: "destructive",
    } as const

    const labels = {
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

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "default",
      cadastrador: "secondary",
      public: "outline",
    } as const

    const labels = {
      admin: "Admin",
      cadastrador: "Cadastrador",
      public: "Público",
    }

    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Gerencie eventos e usuários do AgendaCity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.eventosPendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.eventosAprovados}</div>
              <p className="text-xs text-muted-foreground">Total aprovados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.usuariosPendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pendentes">Eventos Pendentes ({eventosPendentes.length})</TabsTrigger>
            <TabsTrigger value="todos-eventos">Todos os Eventos ({eventos.length})</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos Aguardando Aprovação</CardTitle>
                <CardDescription>Eventos que precisam ser analisados e aprovados ou rejeitados</CardDescription>
              </CardHeader>
              <CardContent>
                {eventosPendentes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventosPendentes.map((evento) => (
                      <EventCard
                        key={evento.id}
                        evento={evento}
                        showActions={true}
                        showDocuments={true}
                        onApprove={(id) => handleEventAction(id, "aprovado")}
                        onReject={(id) => handleEventAction(id, "rejeitado")}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum evento pendente</h3>
                    <p className="text-muted-foreground">Todos os eventos foram processados. Ótimo trabalho!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todos-eventos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Aprovados ({eventosAprovados.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {eventosAprovados.map((evento) => (
                    <div key={evento.id} className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">{evento.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{evento.promotor_nome}</p>
                      <p className="text-xs text-muted-foreground">{evento.local}</p>
                    </div>
                  ))}
                  {eventosAprovados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum evento aprovado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Rejeitados ({eventosRejeitados.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {eventosRejeitados.map((evento) => (
                    <div key={evento.id} className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">{evento.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{evento.promotor_nome}</p>
                      <p className="text-xs text-muted-foreground">{evento.local}</p>
                    </div>
                  ))}
                  {eventosRejeitados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum evento rejeitado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de Eventos:</span>
                      <span className="font-semibold">{stats.totalEventos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa de Aprovação:</span>
                      <span className="font-semibold">
                        {stats.totalEventos > 0 ? Math.round((stats.eventosAprovados / stats.totalEventos) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pendentes:</span>
                      <span className="font-semibold text-orange-600">{stats.eventosPendentes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>Visualize e gerencie roles e status dos usuários do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{getInitials(user.nome)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.auth_user?.email || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Select value={user.role} onValueChange={(value) => handleUserRoleChange(user.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Público</SelectItem>
                                <SelectItem value="cadastrador">Cadastrador</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.status_pedido}
                              onValueChange={(value) => handleUserStatusChange(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="aprovado">Aprovado</SelectItem>
                                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.status_pedido)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {users.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-muted-foreground">Ainda não há usuários cadastrados no sistema.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
