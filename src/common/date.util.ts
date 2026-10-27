/**
 * Converteert een Date object naar een string in YYYY-MM-DD formaat.
 */
export function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


/**
 * Converteert een YYYY-MM-DD string naar een Nederlandse weergave DD-MM-YYYY.
 */
export function ymdToDutchDisplay(ymd: string): string {
  const [year, month, day] = ymd.split('-');
  return `${day}-${month}-${year}`;
}


/**
 * Converteert een Date object naar een lange Nederlandse datumstring met dag van de week.
 */
export function toDutchLongDate(date: Date): string {
  const weekdays = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const weekday = weekdays[date.getDay()] ?? '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${weekday} ${day}-${month}-${year}`;
}


/**
 * Geeft de datum van vandaag (YYYY-MM-DD) in de opgegeven tijdzone.
 */
export function todayYmd(timeZone = 'Europe/Amsterdam'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}


/**
 * Telt een aantal dagen op bij een YYYY-MM-DD string. Rekent in UTC, zodat zomer/wintertijd geen invloed heeft.
 */
export function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().substring(0, 10);
}


/**
 * ISO dag van de week voor een YYYY-MM-DD string, gelijk aan PHP format('N'): 1 = maandag ... 7 = zondag.
 */
export function isoWeekday(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}
