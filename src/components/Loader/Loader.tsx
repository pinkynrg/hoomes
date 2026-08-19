import { useLocalStorage } from 'usehooks-ts'
import classnames from 'classnames'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Progress } from 'antd'
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { JobsResponse } from '../../types'
import style from './Loader.module.scss'
import { db } from '../../dbConfig'

interface LoaderProps {
  className?: string
}

interface Summary {
  imported: number
  failed: number
}

const POLL_INTERVAL = 5000

const comuniLabel = (count: number) => (count === 1 ? 'comune' : 'comuni')

const Loader = ({
  className,
}: LoaderProps) => {
  const [, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [status, setStatus] = useState<string | null>('idle')
  const [percentage, setPercentage] = useState(0)
  const [done, setDone] = useState(0)
  const [failed, setFailed] = useState(0)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const { jobUUID } = useParams()
  const navigate = useNavigate()

  const fetchJobStatus = useCallback(() => {
    if (status === 'failed' || status === 'partial') return

    axios.get<JobsResponse>(`/v1/jobs/${jobUUID}`).then((response) => {
      setStatus('progress')
      const { jobs, finished, result } = response.data
      const failedJobsCount = response.data.failed
        ?? jobs.filter((job) => job.status === 'failed').length

      if (finished) {
        if (result.length > 0) {
          db.homes.bulkPut(result)
        }
        setRequest(null)

        // Some comuni never came back: say so instead of quietly showing less.
        if (failedJobsCount > 0) {
          setStatus('partial')
          setSummary({ imported: result.length, failed: failedJobsCount })
        } else {
          navigate('/listing')
        }
        return
      }

      const settledJobsCount = jobs.filter((job) => ['finished', 'failed'].includes(job.status)).length
      setDone(settledJobsCount)
      setFailed(failedJobsCount)
      setTotal(jobs.length)
      setPercentage(Math.floor((settledJobsCount / jobs.length) * 100))
    }).catch(() => {
      setStatus('failed')
    })
  }, [jobUUID, navigate, setRequest, status])

  useEffect(() => {
    fetchJobStatus()
    const intervalId = setInterval(fetchJobStatus, POLL_INTERVAL)
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchJobStatus])

  const handleRequestAnotherCity = () => {
    setRequest(null)
    navigate('/request')
  }

  if (status === 'failed') {
    return (
      <div className={classnames(style.Container, className)}>
        <div className={style.Panel}>
          <span className={classnames(style.Badge, style.BadgeError)}>
            <WarningOutlined />
          </span>
          <h1 className={style.Title}>Ricerca interrotta</h1>
          <p className={style.Text}>
            Non riusciamo più a contattare il server. Puoi riprovare tra poco
            oppure avviare una nuova ricerca.
          </p>
          <div className={style.Buttons}>
            <Button type="primary" onClick={() => setStatus('idle')}>
              Riprova
            </Button>
            <Button type="text" onClick={handleRequestAnotherCity}>
              Nuova ricerca
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'partial' && summary) {
    return (
      <div className={classnames(style.Container, className)}>
        <div className={style.Panel}>
          <span className={classnames(style.Badge, style.BadgeWarning)}>
            <ExclamationCircleOutlined />
          </span>
          <h1 className={style.Title}>Ricerca completata in parte</h1>
          <p className={style.Text}>
            {`${summary.failed} ${comuniLabel(summary.failed)} non ${summary.failed === 1 ? 'ha' : 'hanno'} risposto: `}
            il portale ci ha rifiutato le richieste. Gli annunci già salvati
            restano al loro posto, riprova più tardi per i comuni mancanti.
          </p>
          <div className={style.Buttons}>
            { summary.imported > 0 && (
              <Button type="primary" onClick={() => navigate('/listing')}>
                {`Vedi i risultati (${summary.imported})`}
              </Button>
            )}
            <Button type={summary.imported > 0 ? 'text' : 'primary'} onClick={handleRequestAnotherCity}>
              Nuova ricerca
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Panel}>
        <span className={style.Badge}>
          <span className={style.Pulse} />
        </span>
        <h1 className={style.Title}>Stiamo raccogliendo gli annunci</h1>
        <p className={style.Text}>
          Interroghiamo Caasa.it comune per comune, senza fretta per non farci
          bloccare. Puoi chiudere la pagina: la ricerca prosegue.
        </p>

        <div className={style.ProgressBlock}>
          <div className={style.ProgressHead}>
            <span className={style.Percent}>
              {percentage}
              <small>%</small>
            </span>
            <span className={style.ProgressMeta}>
              { total > 0
                ? `${done} di ${total} ${comuniLabel(total)} completati`
                : 'Avvio della ricerca…' }
            </span>
          </div>
          <Progress
            percent={percentage}
            status="active"
            showInfo={false}
            strokeColor={{ from: '#ad4e28', to: '#d2825b' }}
            trailColor="#f2ebe2"
          />
          { failed > 0 && (
            <p className={style.Warning}>
              <ExclamationCircleOutlined />
              {`${failed} ${comuniLabel(failed)} non ${failed === 1 ? 'ha' : 'hanno'} risposto`}
            </p>
          )}
        </div>

        <div className={style.Buttons}>
          <Button type="text" onClick={handleRequestAnotherCity}>
            Cerca in altri comuni
          </Button>
        </div>
      </div>
    </div>
  )
}

export { Loader }
