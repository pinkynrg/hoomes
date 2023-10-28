// requests

// responses

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

interface Home {
  match: number;
  uuid: string;
  url: string;
  image: string;
  title: string;
  location: string;
  m2: number;
  province: string;
  region: string,
  price: number;
  comment: string;
  source: string;
  created_at: string;
  updated_at: string;
}

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
export type { 
  Home,
  Location,
  JobResponse,
  RequestResponse,
  JobStatusTypes,
}