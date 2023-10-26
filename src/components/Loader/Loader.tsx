import { useLocalStorage } from 'usehooks-ts';
import style from './Loader.module.scss';
import classnames from 'classnames';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { JobResponse } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';

interface LoaderProps {
  className?: string
}

const Loader = ({
  className,
}: LoaderProps) => {

  const [, setData] = useLocalStorage('data', {})
  const [message, setMessage] = useState('')
  const { jobUUID } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<JobResponse>(`/v1/jobs/${jobUUID}`).then(response => {
      if (response.data.status === 'finished') {
        setData(response.data.result)
        navigate('/listing')
      }
      else {
        setMessage(`job status: ${response.data.status}`)
      }
    }).catch(e => {
      setMessage(`there was an error fetching the data: ${e}`)
    })
  }, [jobUUID, navigate, setData])

  return (
    <div className={classnames(style.Container, className)}>
      { message }
    </div>
  )
};

export { Loader };
