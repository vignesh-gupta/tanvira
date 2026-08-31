"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { Banner } from "@/lib/sanity/types"

const DEFAULT_SLIDE: Banner = {
  id: "default",
  image: { url: "" },
  headline: "Everyday elegance, made accessible",
  ctaLabel: "Shop Now",
  ctaLink: "/products",
}

// Renders every "hero"-placement banner from Sanity (sorted by displayOrder)
// as a carousel — content editors control the slides by adding/reordering/
// toggling banner documents, no code change needed.
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const slides = banners.length > 0 ? banners : [DEFAULT_SLIDE]
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [autoplay] = React.useState(() => Autoplay({ delay: 6000, stopOnInteraction: false }))

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <Carousel setApi={setApi} opts={{ loop: slides.length > 1 }} plugins={[autoplay]}>
      <CarouselContent className="ml-0">
        {slides.map((banner) => (
          <CarouselItem key={banner.id} className="pl-0">
            <HeroSlide banner={banner} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
          {slides.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      ) : null}
    </Carousel>
  )
}

function HeroSlide({ banner }: { banner: Banner }) {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-muted">
      {banner.image?.url ? (
        <Image
          src={banner.image.url}
          alt={banner.image.alt ?? banner.headline}
          fill
          priority
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
      <div className="relative mx-auto max-w-2xl px-4 text-center text-white">
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">{banner.headline}</h1>
        {banner.subtext ? <p className="mt-4 text-base text-white/90">{banner.subtext}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full px-8 shadow-lg">
            <Link href={banner.ctaLink ?? "/products"}>{banner.ctaLabel ?? "Shop Now"}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/70 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/products">Explore Collection</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
