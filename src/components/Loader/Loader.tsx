import { useLocalStorage } from 'usehooks-ts'
import classnames from 'classnames'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Progress } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { JobsResponse } from '../../types'
import style from './Loader.module.scss'
import { db } from '../../dbConfig'

interface LoaderProps {
  className?: string
}

const POLL_INTERVAL = 5000

const Loader = ({
  className,
}: LoaderProps) => {
  const [, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [status, setStatus] = useState<string | null>('idle')
  const [percentage, setPercentage] = useState(0)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const { jobUUID } = useParams()
  const navigate = useNavigate()

  const fetchJobStatus = useCallback(() => {
    if (status === 'failed') return

    axios.get<JobsResponse>(`/v1/jobs/${jobUUID}`).then((response) => {
      setStatus('progress')
      if (response.data.finished) {
        db.homes.bulkPut(response.data.result)
        setRequest(null)
        navigate('/listing')
      } else {
        const { jobs } = response.data
        const finishedJobsCount = jobs.filter((job) => ['finished', 'failed'].includes(job.status)).length
        setDone(finishedJobsCount)
        setTotal(jobs.length)
        setPercentage(Math.floor((finishedJobsCount / jobs.length) * 100))
      }
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

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Panel}>
        <span className={style.Badge}>
          <span className={style.Pulse} />
        </span>
        <h1 className={style.Title}>Stiamo raccogliendo gli annunci</h1>
        <p className={style.Text}>
          Interroghiamo Idealista e Caasa.it comune per comune.
          Puoi chiudere la pagina: la ricerca prosegue e i risultati ti aspettano qui.
        </p>

        <div className={style.ProgressBlock}>
          <div className={style.ProgressHead}>
            <span className={style.Percent}>
              {percentage}
              <small>%</small>
            </span>
            <span className={style.ProgressMeta}>
              { total > 0
                ? `${done} di ${total} comuni completati`
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
