import { useLocalStorage } from 'usehooks-ts';
import style from './Loader.module.scss';
import classnames from 'classnames';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { JobResponse } from '../../types';
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
  const [message, setMessage] = useState('')
  const { jobUUID } = useParams();
  const navigate = useNavigate();

  const fetchJobStatus = useCallback(() => {
    axios.get<JobResponse>(`/v1/jobs/${jobUUID}`).then(response => {
      if (response.data.status === 'finished') {
        setData(response.data.result)
        setRequest(null)
        navigate('/listing')
      }
      else {
        setMessage(`job status: ${response.data.status}`)
      }
    }).catch(e => {
      setMessage(`there was an error fetching the data: ${e}`)
    })
  }, [jobUUID, navigate, setData, setRequest])

  useEffect(() => {
    const intervalId = setInterval(fetchJobStatus, 1000);
    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    }
  }, [fetchJobStatus])

  const handleRequestAnotherCity = () => {
    navigate('/request')
  }

  return (
    <div className={classnames(style.Container, className)}>
      { message }
      <Button onClick={handleRequestAnotherCity} > 
        Request another City 
      </Button>
    </div>
  )
};

export { Loader };
