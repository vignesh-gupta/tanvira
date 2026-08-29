import {defineField, defineType} from 'sanity'

export const banner = defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'subtext',
      title: 'Subtext',
      type: 'string',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA label',
      type: 'string',
      initialValue: 'Shop Now',
    }),
    defineField({
      name: 'ctaLink',
      title: 'CTA link',
      description: 'Relative path, e.g. /products or /products/category-slug',
      type: 'string',
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'string',
      options: {
        list: [
          {title: 'Homepage Hero', value: 'hero'},
          {title: 'Homepage Collection Strip', value: 'collection'},
        ],
      },
      initialValue: 'hero',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'headline', media: 'image', subtitle: 'placement'},
  },
})