export function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function formatOrderNumber(orderSeq: number) {
  return `TVA${orderSeq}`
}
