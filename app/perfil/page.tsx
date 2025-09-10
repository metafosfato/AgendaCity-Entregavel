"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/event-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Calendar, Shield, Plus } from "lucide-react"
import Link from "next/link"
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
}

interface UserProfile {
  id: string
  nome: string
  role: "admin" | "cadastrador" | "public"
  status_pedido: "pendente" | "aprovado" | "rejeitado"
  created_at: string
}

export default function PerfilPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
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
    const fetchEventos = async () => {
      if (!authUser) return

      try {
        const { data, error } = await supabase
          .from("eventos")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Erro ao buscar eventos:", error)
          toast.error("Erro ao carregar seus eventos")
          return
        }

        setEventos(data || [])
      } catch (error) {
        console.error("Erro inesperado:", error)
        toast.error("Erro inesperado ao carregar eventos")
      } finally {
        setLoadingEventos(false)
      }
    }

    if (authUser) {
      fetchEventos()
    }
  }, [authUser, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!authUser || !userProfile) {
    return null
  }

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

  const eventosPorStatus = {
    rascunho: eventos.filter((e) => e.status === "rascunho"),
    pendente: eventos.filter((e) => e.status === "pendente"),
    aprovado: eventos.filter((e) => e.status === "aprovado"),
    rejeitado: eventos.filter((e) => e.status === "rejeitado"),
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{getInitials(userProfile.nome)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{userProfile.nome}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {authUser.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(userProfile.status_pedido)}
                  {userProfile.role === "admin" && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Membro desde {new Date(userProfile.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{eventos.length} eventos criados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{eventosPorStatus.aprovado.length} eventos aprovados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Tabs */}
        <Tabs defaultValue="todos" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="todos">Todos ({eventos.length})</TabsTrigger>
              <TabsTrigger value="rascunho">Rascunhos ({eventosPorStatus.rascunho.length})</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes ({eventosPorStatus.pendente.length})</TabsTrigger>
              <TabsTrigger value="aprovado">Aprovados ({eventosPorStatus.aprovado.length})</TabsTrigger>
              <TabsTrigger value="rejeitado">Rejeitados ({eventosPorStatus.rejeitado.length})</TabsTrigger>
            </TabsList>

            <Button asChild>
              <Link href="/criar-evento">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          </div>

          <TabsContent value="todos" className="space-y-6">
            {loadingEventos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : eventos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventos.map((evento) => (
                  <EventCard key={evento.id} evento={evento} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Nenhum evento encontrado</CardTitle>
                  <CardDescription>Você ainda não criou nenhum evento.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/criar-evento">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Evento
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {Object.entries(eventosPorStatus).map(([status, eventosStatus]) => (
            <TabsContent key={status} value={status} className="space-y-6">
              {eventosStatus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {eventosStatus.map((evento) => (
                    <EventCard key={evento.id} evento={evento} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Nenhum evento {status}</CardTitle>
                    <CardDescription>Você não possui eventos com status "{status}".</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
