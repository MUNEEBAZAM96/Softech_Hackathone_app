export const formatCurrency = (value: number, currency = "PKR"): string => {
  const formatter = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  });
  const sign = value < 0 ? "-" : "";
  return `${sign}${currency} ${formatter.format(Math.abs(Math.round(value)))}`;
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
