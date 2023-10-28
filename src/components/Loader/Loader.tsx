import { useLocalStorage } from 'usehooks-ts';
import style from './Loader.module.scss';
import classnames from 'classnames';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { JobResponse, JobStatusTypes } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'antd';

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
      { `job status: ${status}` }
      <Button onClick={handleRequestAnotherCity} > 
        Request another City 
      </Button>
    </div>
  )
};

export { Loader };
