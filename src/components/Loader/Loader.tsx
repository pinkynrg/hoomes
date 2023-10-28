import { useLocalStorage } from 'usehooks-ts';
import style from './Loader.module.scss';
import classnames from 'classnames';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { JobResponse, JobStatusTypes } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Divider } from 'antd';

interface LoaderProps {
  className?: string
}

const Loader = ({
  className,
}: LoaderProps) => {

  const [, setData] = useLocalStorage('data', {})
  const [, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [status, setStatus] = useState<JobStatusTypes | null>(null)
  const { jobUUID } = useParams();
  const navigate = useNavigate();

  const fetchJobStatus = useCallback(() => {
    if (status === null || !['finished', 'stopped', 'cancelled', 'failed'].includes(status)) {
      axios.get<JobResponse>(`/v1/jobs/${jobUUID}`).then(response => {
        setStatus(response.data.status)
        if (response.data.status === 'finished') {
          setData(response.data.result)
          setRequest(null)
          navigate('/listing')
        }
      }).catch(e => {
        setStatus(e)  
      })
    }
  }, [jobUUID, navigate, setData, setRequest, status])

  useEffect(() => {
    const intervalId = setInterval(fetchJobStatus, 1000);
    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    }
  }, [fetchJobStatus])

  const handleRequestAnotherCity = () => {
    setRequest(null)
    navigate('/request')
  }

  return (
    <div className={classnames(style.Container, className)}>
      <h1> Sto scaricando... </h1>
      <p> 
        Sei libero di attendere o chiudere la pagina e tornare piú tardi per controllare.
        <br/><br/>
        Lo stato di scaricamento é <b>{`${status ?? 'unknown'}`}</b>
      </p>
      <Divider className={style.Divider}> oppure </Divider>
      <Button onClick={handleRequestAnotherCity} > 
        Richiedi un'altra cittá
      </Button>
    </div>
  )
};

export { Loader };
