import { PortableText, type PortableTextComponents, type PortableTextBlock } from "@portabletext/react"

const components: PortableTextComponents = {
  block: {
    h4: ({ children }) => (
      <h4 className="mt-4 mb-2 font-heading text-base font-medium text-foreground">{children}</h4>
    ),
    normal: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 text-sm">{children}</ul>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
  },
}

export function RichText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />
}
