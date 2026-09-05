import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Required for accessibility — describe what the image shows.',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(8),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description:
        'Rich text — include material, size/length, and care instructions here. No separate variant fields; everything lives in this content block.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h4'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (INR)',
      description: 'Enter the price in rupees, e.g. 1499. Converted to paise when an order is created.',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare-at price (INR)',
      description:
        'Optional original/MRP price shown struck through with a discount badge, e.g. 1999. Leave blank when there is no discount.',
      type: 'number',
      validation: (Rule) =>
        Rule.positive().custom((value, context) => {
          if (value === undefined) return true
          const price = (context.document as {price?: number})?.price
          if (typeof price === 'number' && value <= price) {
            return 'Compare-at price must be greater than the price.'
          }
          return true
        }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isBundle',
      title: 'Is this a bundle?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'bundleItems',
      title: 'Bundle items',
      description: 'Only used when "Is this a bundle?" is on — the individual products included in this bundle.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      hidden: ({document}) => !document?.isBundle,
    }),
    defineField({
      name: 'stock',
      title: 'Stock quantity',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(0),
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Active (visible on storefront)',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'name', media: 'images.0', subtitle: 'price'},
    prepare({title, media, subtitle}) {
      return {title, media, subtitle: subtitle ? `₹${subtitle}` : ''}
    },
  },
})