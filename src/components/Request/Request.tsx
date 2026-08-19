import axios from 'axios'
import classnames from 'classnames'
import { useEffect, useState } from 'react'
import { useLocalStorage, useSessionStorage } from 'usehooks-ts'
import { Button } from 'antd'
import {
  ArrowRightOutlined,
  CloudDownloadOutlined,
  FileSearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Navigate } from 'react-router-dom'
import { Location, RequestResponse } from '../../types'
import { CityPicker } from '../CityPicker/CityPicker'
import style from './Request.module.scss'

interface RequestProps {
  className?: string
}

/* The backend enqueues one scraping job per comune and rejects anything above this. */
const MAX_CITIES = 312

const FEATURES = [
  {
    icon: <FileSearchOutlined />,
    title: 'Cerca nelle descrizioni',
    text: 'Parole come “vista panoramica”, “giardino” o “da ristrutturare”, non solo i filtri standard.',
  },
  {
    icon: <CloudDownloadOutlined />,
    title: 'Una provincia alla volta',
    text: 'Aggiungi tutti i comuni di una provincia in un colpo solo, invece di cercarli uno per uno.',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Restano sul tuo browser',
    text: 'I risultati vengono salvati in locale: le ricerche successive sono immediate.',
  },
]

const Request = ({
  className,
}: RequestProps) => {
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [request, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [codes, setCodes] = useState<string[]>([])
  const [, setUrl] = useSessionStorage<string | null>('url', null)

  const handleRequest = () => {
    setSubmitting(true)
    setError(null)
    axios.post<RequestResponse>('/v1/request', { codes }).then((response) => {
      if (response.data.jobs_id) {
        setRequest(response.data.jobs_id.join(','))
      }
    }).catch(() => {
      setSubmitting(false)
      setError('Non siamo riusciti ad avviare la ricerca. Prova a selezionare meno comuni.')
    })
  }

  useEffect(() => {
    axios.get<Location[]>('/v1/locations').then((response) => {
      setLocations(response.data)
    }).catch(() => {
      setError('Non siamo riusciti a caricare l’elenco dei comuni. Ricarica la pagina per riprovare.')
    }).finally(() => {
      setLoadingLocations(false)
    })
  }, [])

  useEffect(() => {
    setUrl(null)
  }, [setUrl])

  if (request) {
    return <Navigate to={`/listing/${request}`} replace />
  }

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Content}>
        <header className={style.Hero}>
          <span className={style.Eyebrow}>Annunci da Caasa.it</span>
          <h1 className={style.Title}>
            Trova casa in Italia
            <br />
            <em>cercando dentro</em>
            {' '}
            gli annunci
          </h1>
          <p className={style.Subtitle}>
            Scegli i comuni che ti interessano: scarichiamo gli annunci in vendita
            e li rendiamo cercabili parola per parola.
          </p>
        </header>

        <section className={style.Panel}>
          <div className={style.PanelHeader}>
            <h2 className={style.PanelTitle}>Dove vuoi cercare?</h2>
            <span className={style.Counter}>
              { codes.length === 0
                ? 'Nessun comune selezionato'
                : `${codes.length} ${codes.length === 1 ? 'comune selezionato' : 'comuni selezionati'}` }
            </span>
          </div>

          <CityPicker
            locations={locations}
            value={codes}
            onChange={setCodes}
            max={MAX_CITIES}
            loading={loadingLocations}
          />

          { error && <div className={style.Error} role="alert">{error}</div> }

          <div className={style.Actions}>
            <Button
              type="primary"
              size="large"
              className={style.Submit}
              disabled={codes.length === 0}
              loading={submitting}
              onClick={handleRequest}
            >
              Cerca case
              { !submitting && <ArrowRightOutlined /> }
            </Button>
            <span className={style.Hint}>
              Qualche minuto per pochi comuni, di più per una provincia intera:
              puoi chiudere la pagina, la ricerca continua.
            </span>
          </div>
        </section>

        <ul className={style.Features}>
          { FEATURES.map((feature) => (
            <li key={feature.title} className={style.Feature}>
              <span className={style.FeatureIcon}>{feature.icon}</span>
              <span className={style.FeatureTitle}>{feature.title}</span>
              <span className={style.FeatureText}>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export { Request }
