import { Injectable } from '@nestjs/common';
import { APIService, HeliosDatasetResponse } from './api.service';

export interface RoosterRecord {
  ID?: number;
  DATUM: string;
  DDWV?: boolean;
  CLUB_BEDRIJF?: boolean;
  WINTER_WERK?: boolean;
  MIN_SLEEPSTART?: number;
  MIN_LIERSTART?: number;
  OPMERKINGEN?: string | null;
  VERWIJDERD?: boolean;
  LAATSTE_AANPASSING?: string;
}

@Injectable()
export class RoosterService {
  constructor(private readonly apiService: APIService) {}

  async getRooster(datum: string): Promise<RoosterRecord> {
    return this.apiService.get<RoosterRecord>('Rooster/GetObject', {
      DATUM: datum
    });
  }

  /**
   * Haalt alle roosterdagen op tussen begin- en einddatum (inclusief).
   * Met verwijderd = true worden alleen de verwijderde roosterdagen opgehaald.
   */
  async getRoosterDagen(beginDatum: string, eindDatum: string, verwijderd = false): Promise<RoosterRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<RoosterRecord>>('Rooster/GetObjects', {
      BEGIN_DATUM: beginDatum,
      EIND_DATUM: eindDatum,
      VELDEN: 'ID,DATUM,VERWIJDERD',
      VERWIJDERD: verwijderd ? true : undefined,
    });
    return response.dataset ?? [];
  }

  /**
   * Voegt een nieuwe roosterdag toe (POST Rooster/SaveObject => Rooster.AddObject in Helios).
   */
  async addRooster(rooster: RoosterRecord): Promise<RoosterRecord> {
    return this.apiService.post<RoosterRecord>('Rooster/SaveObject', rooster);
  }

  /**
   * Zet een verwijderde roosterdag terug (PATCH Rooster/RestoreObject => Rooster.HerstelObject in Helios).
   */
  async restoreRooster(id: number): Promise<void> {
    await this.apiService.patch('Rooster/RestoreObject', { ID: id });
  }

  /**
   * Past een bestaande roosterdag aan (PUT Rooster/SaveObject => Rooster.UpdateObject in Helios).
   */
  async updateRooster(rooster: RoosterRecord): Promise<RoosterRecord> {
    return this.apiService.put<RoosterRecord>('Rooster/SaveObject', rooster);
  }
}
