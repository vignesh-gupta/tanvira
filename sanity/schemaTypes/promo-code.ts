import {defineField, defineType} from 'sanity'

export const promoCode = defineType({
  name: 'promoCode',
  title: 'Promo Code',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      description: 'What the customer types in, e.g. TANVIRA10. Stored uppercase.',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase(),
    }),
    defineField({
      name: 'discountType',
      title: 'Discount type',
      type: 'string',
      options: {
        list: [
          {title: 'Flat amount (₹)', value: 'flat'},
          {title: 'Percentage (%)', value: 'percent'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      description: 'Rupees for flat discounts, or a number 1–100 for percentage discounts.',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid from',
      type: 'datetime',
    }),
    defineField({
      name: 'validTo',
      title: 'Valid to',
      type: 'datetime',
    }),
    defineField({
      name: 'usageLimit',
      title: 'Total usage limit',
      description: 'Leave blank for unlimited. Actual redemption counts are tracked in the app database, not here.',
      type: 'number',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'code', subtitle: 'discountType'},
  },
})