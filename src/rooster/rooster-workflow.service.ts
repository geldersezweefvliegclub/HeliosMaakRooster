import { Injectable, Logger } from '@nestjs/common';
import { LoginService } from '../helios/services/login.service';
import { RoosterRecord, RoosterService } from '../helios/services/rooster.service';
import { addDaysYmd, todayYmd } from '../common/date.util';
import { RoosterBuilder } from './rooster.builder';

/**
 * Worker die controleert of er voor het komende jaar voor iedere dag een rooster in Helios staat.
 * Ontbrekende roosterdagen worden aangemaakt, verwijderde roosterdagen worden teruggezet met de default waarden.
 */
@Injectable()
export class RoosterWorkflowService
{
  private readonly logger = new Logger(RoosterWorkflowService.name);
  private running = false;

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly roosterBuilder: RoosterBuilder
  ) {}

  /**
   * Voert de volledige workflow uit, vanaf vandaag tot en met vandaag + ROOSTER_DAGEN_VOORUIT (default 365)
   */
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Rooster workflow is al actief, deze aanroep wordt overgeslagen');
      return;
    }

    this.running = true;
    try {
      const dagenVooruit = Number(process.env.ROOSTER_DAGEN_VOORUIT || 365);
      const beginDatum = todayYmd(process.env.CRON_TIMEZONE || 'Europe/Amsterdam');
      const eindDatum = addDaysYmd(beginDatum, dagenVooruit);
      this.logger.log(`Start rooster workflow, periode ${beginDatum} t/m ${eindDatum}`);

      await this.loginService.login();

      const [bestaand, verwijderd] = await Promise.all([
        this.roosterService.getRoosterDagen(beginDatum, eindDatum),
        this.roosterService.getRoosterDagen(beginDatum, eindDatum, true),
      ]);

      // Datum kan als "YYYY-MM-DD" of "YYYY-MM-DD hh:mm:ss" terugkomen, alleen het datum deel gebruiken
      const aanwezig = new Set(bestaand.map((r) => this.datum(r)));

      // Per datum het laatst verwijderde record (hoogste ID), een datum kan meerdere keren verwijderd zijn
      const verwijderdPerDatum = new Map<string, RoosterRecord>();
      for (const record of verwijderd) {
        const datum = this.datum(record);
        const huidig = verwijderdPerDatum.get(datum);
        if (!huidig || (record.ID ?? 0) > (huidig.ID ?? 0)) {
          verwijderdPerDatum.set(datum, record);
        }
      }

      const ontbrekend: string[] = [];
      for (let datum = beginDatum; datum <= eindDatum; datum = addDaysYmd(datum, 1)) {
        if (!aanwezig.has(datum)) {
          ontbrekend.push(datum);
        }
      }

      this.logger.log(`${aanwezig.size} roosterdagen aanwezig, ${ontbrekend.length} ontbrekend`);

      let aangemaakt = 0;
      let hersteld = 0;
      let mislukt = 0;
      for (const datum of ontbrekend) {
        const rooster = this.roosterBuilder.build(datum);
        const verwijderdRecord = verwijderdPerDatum.get(datum);
        try {
          if (verwijderdRecord?.ID) {
            await this.herstelRooster(verwijderdRecord.ID, rooster);
            hersteld++;
          } else {
            const record = await this.roosterService.addRooster(rooster);
            aangemaakt++;
            this.logger.log(`Roosterdag ${datum} aangemaakt, ID=${record.ID} ${this.omschrijving(rooster)}`);
          }
        } catch (error: any) {
          mislukt++;
          this.logger.error(`Aanmaken roosterdag ${datum} mislukt: ${error?.beschrijving ?? error?.message ?? JSON.stringify(error)}`);
        }
      }

      this.logger.log(`Rooster workflow klaar: ${aangemaakt} aangemaakt, ${hersteld} hersteld, ${mislukt} mislukt`);
    } catch (error: any) {
      this.logger.error(`Rooster workflow mislukt: ${error?.beschrijving ?? error?.message ?? JSON.stringify(error)}`, error?.stack);
    } finally {
      this.running = false;
    }
  }

  /**
   * Zet een verwijderde roosterdag terug en overschrijft de velden met de default waarden
   */
  private async herstelRooster(id: number, rooster: RoosterRecord): Promise<void> {
    await this.roosterService.restoreRooster(id);
    await this.roosterService.updateRooster({ ...rooster, ID: id });
    this.logger.log(`Verwijderde roosterdag ${rooster.DATUM} hersteld, ID=${id} ${this.omschrijving(rooster)}`);
  }

  private datum(record: RoosterRecord): string {
    return record.DATUM.substring(0, 10);
  }

  private omschrijving(rooster: RoosterRecord): string {
    return `CLUB_BEDRIJF=${rooster.CLUB_BEDRIJF} DDWV=${rooster.DDWV} WINTER_WERK=${rooster.WINTER_WERK}`;
  }
}
