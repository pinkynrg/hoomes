import { useLocalStorage } from 'usehooks-ts'
import classnames from 'classnames'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Divider, Progress } from 'antd'
import { JobsResponse } from '../../types'
import style from './Loader.module.scss'
import { db } from '../../dbConfig'

interface LoaderProps {
  className?: string
}

const Loader = ({
  className,
}: LoaderProps) => {
  const [, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [status, setStatus] = useState<string | null>('idle')
  const [percentage, setPercentage] = useState(0)
  const { jobUUID } = useParams()
  const navigate = useNavigate()

  const fetchJobStatus = useCallback(() => {
    if (status !== 'failed') {
      axios.get<JobsResponse>(`/v1/jobs/${jobUUID}`).then((response) => {
        setStatus('progress')
        if (response.data.finished) {
          db.homes.clear()
          db.homes.bulkPut(response.data.result)
          setRequest(null)
          navigate('/listing')
        } else {
          const { jobs } = response.data
          const finishedJobsCount = jobs.filter((job) => ['finished', 'failed'].includes(job.status)).length
          const realPercentage = Math.floor((finishedJobsCount / jobs.length) * 100)
          setPercentage(realPercentage)
        }
      }).catch(() => {
        setStatus('failed')
      })
    }
  }, [jobUUID, navigate, setRequest, status])

  useEffect(() => {
    const intervalId = setInterval(fetchJobStatus, 5000)
    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchJobStatus])

  const handleRequestAnotherCity = () => {
    setRequest(null)
    navigate('/request')
  }

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Panel}>
        <h1> Sto scaricando... </h1>
        <div>
          Sei libero di attendere o chiudere la pagina e tornare piú tardi per controllare.
          <br />
          <br />
          {
            status !== 'idle' && <Progress percent={percentage} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />
}
        </div>
        <Divider className={style.Divider}> oppure </Divider>
        <Button onClick={handleRequestAnotherCity}>
          Richiedi un&apos;altra cittá
        </Button>
      </div>
    </div>
  )
}

export { Loader }
