"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Download, FileText, ImageIcon, AlertCircle, CheckCircle, X } from "lucide-react"
import Image from "next/image"

interface DocumentItem {
  name: string
  url: string | null
  type: "image" | "pdf" | "doc"
  required: boolean
}

interface DocumentSection {
  title: string
  documents: DocumentItem[]
}

interface DocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  evento: {
    id: string
    titulo: string
    banner_url?: string | null
    foto1_url?: string | null
    foto2_url?: string | null
    foto3_url?: string | null
    requerimento_autorizacao_url?: string | null
    projeto_evento_url?: string | null
    planta_local_url?: string | null
    avcb_bombeiros_url?: string | null
    apolice_seguro_url?: string | null
    plano_seguranca_url?: string | null
    alvara_funcionamento_url?: string | null
    autorizacao_sonora_doc_url?: string | null
  }
}

export function DocumentViewer({ isOpen, onClose, evento }: DocumentViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const documentSections: DocumentSection[] = [
    {
      title: "Imagens do Evento",
      documents: [
        { name: "Banner Principal", url: evento.banner_url, type: "image", required: true },
        { name: "Foto 1", url: evento.foto1_url, type: "image", required: false },
        { name: "Foto 2", url: evento.foto2_url, type: "image", required: false },
        { name: "Foto 3", url: evento.foto3_url, type: "image", required: false },
      ],
    },
    {
      title: "Documentos Legais",
      documents: [
        { name: "Requerimento de Autorização", url: evento.requerimento_autorizacao_url, type: "pdf", required: true },
        { name: "Projeto do Evento", url: evento.projeto_evento_url, type: "pdf", required: true },
        { name: "Planta do Local", url: evento.planta_local_url, type: "pdf", required: true },
        { name: "AVCB dos Bombeiros", url: evento.avcb_bombeiros_url, type: "pdf", required: true },
        { name: "Apólice de Seguro", url: evento.apolice_seguro_url, type: "pdf", required: true },
        { name: "Plano de Segurança", url: evento.plano_seguranca_url, type: "pdf", required: true },
        { name: "Alvará de Funcionamento", url: evento.alvara_funcionamento_url, type: "pdf", required: false },
        { name: "Autorização Sonora", url: evento.autorizacao_sonora_doc_url, type: "pdf", required: false },
      ],
    },
  ]

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "pdf":
      case "doc":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (url: string | null, required: boolean) => {
    if (url) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (required) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else {
      return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderImageGallery = (documents: DocumentItem[]) => {
    const images = documents.filter((doc) => doc.url)

    if (images.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma imagem anexada</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((doc, index) => (
          <div key={index} className="relative group cursor-pointer">
            <div
              className="aspect-square relative overflow-hidden rounded-lg border"
              onClick={() => setSelectedImage(doc.url!)}
            >
              <Image
                src={doc.url! || "/placeholder.svg"}
                alt={doc.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <p className="text-sm text-center mt-2 font-medium">{doc.name}</p>
          </div>
        ))}
      </div>
    )
  }

  const renderDocumentList = (documents: DocumentItem[]) => {
    return (
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getDocumentIcon(doc.type)}
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(doc.url, doc.required)}
                    <span className="text-sm text-gray-500">
                      {doc.url ? "Anexado" : doc.required ? "Obrigatório - Faltando" : "Opcional - Não anexado"}
                    </span>
                    {doc.required && (
                      <Badge variant={doc.url ? "default" : "destructive"} className="text-xs">
                        {doc.required ? "Obrigatório" : "Opcional"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {doc.url && (
                <div className="flex gap-2">
                  {doc.type === "pdf" && (
                    <Button variant="outline" size="sm" onClick={() => window.open(doc.url!, "_blank")}>
                      Visualizar
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc.url!, doc.name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const getTotalDocuments = () => {
    return documentSections.reduce((total, section) => {
      return total + section.documents.filter((doc) => doc.url).length
    }, 0)
  }

  const getRequiredDocuments = () => {
    const required = documentSections.reduce((total, section) => {
      return total + section.documents.filter((doc) => doc.required).length
    }, 0)

    const attached = documentSections.reduce((total, section) => {
      return total + section.documents.filter((doc) => doc.required && doc.url).length
    }, 0)

    return { required, attached }
  }

  const { required, attached } = getRequiredDocuments()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Documentos do Evento</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">{evento.titulo}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getTotalDocuments()} documentos anexados</Badge>
                  <Badge variant={attached === required ? "default" : "destructive"}>
                    {attached}/{required} obrigatórios
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="images" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="images">
                Imagens ({documentSections[0].documents.filter((d) => d.url).length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documentos ({documentSections[1].documents.filter((d) => d.url).length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 overflow-y-auto max-h-[60vh]">
              <TabsContent value="images" className="mt-0">
                {renderImageGallery(documentSections[0].documents)}
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                {renderDocumentList(documentSections[1].documents)}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal para visualização de imagem em tela cheia */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-2">
            <div className="relative w-full h-[80vh]">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt="Visualização da imagem"
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
