import { Home } from './dbConfig'

type JobStatusTypes = 'queued' | 'started' | 'deferred' | 'finished' | 'stopped' | 'scheduled' | 'canceled' | 'failed'

interface RequestResponseSuccess {
  jobs_id: string[]
  message: string
}

interface RequestResponseFailure {
  jobs_id: undefined,
  error: string,
  code: string,
}

type RequestResponse = RequestResponseFailure | RequestResponseSuccess

interface JobResponse {
  job_id: string,
  status: JobStatusTypes
}

interface JobsResponse {
  jobs: JobResponse[]
  result: Home[]
  finished: boolean
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

interface HomeWithMatch extends Home {
  match: number
}

export type {
  Location,
  RequestResponse,
  JobStatusTypes,
  HomeWithMatch,
  JobsResponse,
}
