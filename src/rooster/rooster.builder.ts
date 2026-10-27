import { Injectable } from '@nestjs/common';
import { isoWeekday } from '../common/date.util';
import { RoosterRecord } from '../helios/services/rooster.service';

/**
 * Bepaalt de standaard waarden van een nieuwe roosterdag.
 * Logica overgenomen uit Helios PHP Rooster.AddObject en DDWV.dagIsDDWV.
 */
@Injectable()
export class RoosterBuilder
{
  private readonly ddwvActief = (process.env.DDWV ?? 'true').toLowerCase() !== 'false';
  private readonly ddwvStart = this.maandDagWaarde(process.env.DDWV_START || '04-01');
  private readonly ddwvEind = this.maandDagWaarde(process.env.DDWV_EIND || '10-31');

  // Default waarden uit de oper_rooster tabel definitie (Rooster.CreateTable)
  private static readonly MIN_SLEEPSTART = 3;
  private static readonly MIN_LIERSTART = 10;

  /**
   * Maak een nieuwe roosterdag voor de opgegeven datum (YYYY-MM-DD).
   */
  build(datum: string): RoosterRecord {
    const weekday = isoWeekday(datum);
    const [, maand, dag] = datum.split('-');
    const dateValue = Number(maand) * 100 + Number(dag);   // Maak maand & dag numeriek

    // alleen tussen 1 maart & 1 november is er een clubbedrijf, op zaterdag en zondag
    const clubBedrijf = dateValue >= 301 && dateValue < 1101 && weekday >= 6;

    // buiten het seizoen is er op zaterdag winterwerk
    const winterWerk = (dateValue < 301 || dateValue >= 1101) && weekday === 6;

    return {
      DATUM: datum,
      CLUB_BEDRIJF: clubBedrijf,
      DDWV: this.dagIsDDWV(dateValue, weekday),
      WINTER_WERK: winterWerk,
      MIN_SLEEPSTART: RoosterBuilder.MIN_SLEEPSTART,
      MIN_LIERSTART: RoosterBuilder.MIN_LIERSTART,
      OPMERKINGEN: null,
    };
  }

  /**
   * DDWV is alleen doordeweeks binnen het DDWV seizoen
   */
  private dagIsDDWV(dateValue: number, weekday: number): boolean {
    if (!this.ddwvActief) {
      return false;
    }

    if (dateValue < this.ddwvStart || dateValue > this.ddwvEind) {
      return false;
    }
    return weekday <= 5;
  }

  /**
   * Converteert "MM-DD" naar MM * 100 + DD
   */
  private maandDagWaarde(mmdd: string): number {
    const [maand, dag] = mmdd.split('-').map(Number);
    return maand * 100 + dag;
  }
}
