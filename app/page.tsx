"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EventCard } from "@/components/event-card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
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

export default function HomePage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
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
      setLoading(false)
    }

    getInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const hoje = new Date().toISOString().split("T")[0]

        const { data, error } = await supabase
          .from("eventos")
          .select("*")
          .eq("status", "aprovado")
          .gte("datas", `{${hoje}}`) // Eventos com datas futuras
          .order("datas", { ascending: true })
          .limit(9)

        if (error) {
          console.error("Erro ao buscar eventos:", error)
          toast.error("Erro ao carregar eventos")
          return
        }

        const eventosFuturos = (data || []).filter((evento) => {
          return evento.datas.some((data: string) => data >= hoje)
        })

        setEventos(eventosFuturos)
      } catch (error) {
        console.error("Erro inesperado:", error)
        toast.error("Erro inesperado ao carregar eventos")
      } finally {
        setLoadingEventos(false)
      }
    }

    fetchEventos()
  }, [supabase])

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 mb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Bem-vindo ao AgendaCity</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sistema municipal para solicitação e aprovação de eventos. Organize seus eventos de forma simples e
            transparente.
          </p>

          {authUser ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/criar-evento">
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Novo Evento
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/perfil">Ver Meus Eventos</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/cadastro">Começar Agora</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Future Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Próximos Eventos</h2>
            <p className="text-muted-foreground">Confira os eventos aprovados que acontecerão em breve</p>
          </div>
        </div>

        {loadingEventos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => (
              <EventCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum evento futuro encontrado</CardTitle>
              <CardDescription>Ainda não há eventos aprovados programados para o futuro.</CardDescription>
            </CardHeader>
            <CardContent>
              {authUser && (
                <Button asChild>
                  <Link href="/criar-evento">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Evento
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
