"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error during auth callback:", error)
        router.push("/auth/error?error=" + encodeURIComponent(error.message))
        return
      }

      if (data.session) {
        // Usuário autenticado com sucesso
        router.push("/")
      } else {
        // Sem sessão, redirecionar para login
        router.push("/login")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Processando autenticação...</h2>
        <p className="text-muted-foreground">Aguarde um momento.</p>
      </div>
    </div>
  )
}
