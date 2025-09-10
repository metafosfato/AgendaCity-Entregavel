import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Erro na Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error ? (
              <p className="text-sm text-muted-foreground text-center">{params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Ocorreu um erro não especificado durante a autenticação.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/login">Tentar Novamente</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Voltar ao Início</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
