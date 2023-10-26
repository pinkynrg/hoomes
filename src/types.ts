// requests

// responses

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

export type { 
  Home,
  JobResponse,
}