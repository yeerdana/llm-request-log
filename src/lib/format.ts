const dateTime = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})
const int = new Intl.NumberFormat("ru-RU")

export const formatDateTime = (iso: string | number): string => dateTime.format(new Date(iso))
export const formatInt = (n: number): string => int.format(Math.round(n))
export const formatMs = (n: number): string => `${formatInt(n)} мс`
export const formatPercent = (ratio: number): string =>
  `${(ratio * 100).toFixed(1).replace(".", ",")} %`
export const formatUsd = (n: number, digits = 6): string => `$${n.toFixed(digits)}`
