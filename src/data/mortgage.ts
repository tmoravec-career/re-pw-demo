// Same formula as paymentAmount() in mock-site/js/app.js.
// Principal and interest only, rounded to the nearest dollar.
export function monthlyPayment(price: number, downPercent: number, annualRate: number, years: number): number {
  const principal = price * (1 - downPercent / 100);
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return Math.round(principal / months);
  const factor = (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  return Math.round(principal * factor);
}
