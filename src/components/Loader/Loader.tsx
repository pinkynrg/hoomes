import { useLocalStorage } from 'usehooks-ts'
import classnames from 'classnames'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Divider } from 'antd'
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
  const { jobUUID } = useParams()
  const navigate = useNavigate()

  const fetchJobStatus = useCallback(() => {
    if (status !== 'finished') {
      axios.get<JobsResponse>(`/v1/jobs/${jobUUID}`).then((response) => {
        setStatus('processing')
        if (response.data.finished) {
          setStatus('finished')
          db.homes.clear()
          db.homes.bulkPut(response.data.result)
          setRequest(null)
          navigate('/listing')
        }
      }).catch((e) => {
        setStatus(e)
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
        <p>
          Sei libero di attendere o chiudere la pagina e tornare piú tardi per controllare.
          <br />
          <br />
          Lo stato é
          {' '}
          <b>{status}</b>
        </p>
        <Divider className={style.Divider}> oppure </Divider>
        <Button onClick={handleRequestAnotherCity}>
          Richiedi un&apos;altra cittá
        </Button>
      </div>
    </div>
  )
}

export { Loader }
