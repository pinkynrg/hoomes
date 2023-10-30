import { Home } from './dbConfig'

type JobStatusTypes = 'queued' | 'started' | 'deferred' | 'finished' | 'stopped' | 'scheduled' | 'canceled' | 'failed'

interface RequestResponse {
  "job_id": string
  "message": string
}

interface InProgressJobResponse {
  "result": null | Home[],
  "status": "failed"
}

interface FinishedJobResponse {
  "result": Home[],
  "status": "finished"
}

type JobResponse = InProgressJobResponse | FinishedJobResponse

interface Location {
  codice: string;
  nome: string;
  zona_codice: string;
  zona_nome: string;
  regione_codice: string;
  regione_nome: string;
  provincia_codice: string;
  provincia_nome: string;
  sigla: string;
  codiceCatastale: string;
  cap: string;
  popolazione: number;
}

interface HomeWithMatch extends Home { 
  match: number 
}

export type { 
  Location,
  JobResponse,
  RequestResponse,
  JobStatusTypes,
  HomeWithMatch,
}