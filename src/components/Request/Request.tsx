import axios from 'axios';
import style from './Request.module.scss';
import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { Location, RequestResponse } from './../../types';
import { useLocalStorage } from 'usehooks-ts';
import { Select } from 'antd';
import { Button } from 'antd';
import { Navigate } from 'react-router-dom';

interface RequestProps {
  className?: string
}

const Request = ({
  className,
}: RequestProps) => {
  const [locations, setLocations] = useLocalStorage<Location[]>('location', [])
  const [request, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [location, setLocation] = useState(null)

  const handleRequest = () => {
    axios.post<RequestResponse>(`/v1/request`, { city: location }).then(response => {
      setRequest(response.data.job_id)
    }).catch(e => {
      console.error(`there was an error fetching the data: ${e}`)
    })
  }

  useEffect(() => {
    axios.get<Location[]>(`/v1/locations`).then(response => {
      setLocations(response.data)
    }).catch(e => {
      console.error(`there was an error fetching the data: ${e}`)
    })
  }, [setLocations])

  if (request) {
    return <Navigate to={`/listing/${request}`} replace />
  }

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Panel}>
        <h1> Seleziona una cittá </h1>
        <p> 
          Il processo potrebbe richiedere diversi minuti di attesa. 
          Sei libero di attendere o chiudere la pagina e tornare piú tardi per controllare.
        </p>
        <Select
          optionLabelProp='name'
          showSearch
          onChange={setLocation}
          filterOption={(input, option) => (option?.value.toLowerCase() ?? '').includes(input.toLowerCase())}
          placeholder="Seleziona una cittá"
          options={locations.map(location => ({ label: location.nome, value: location.nome }))}
          disabled={locations.length === 0}
        />
        <Button 
          disabled={!location}
          onClick={handleRequest}
        > 
          Vai!
        </Button>
      </div>
    </div>
  )
}

export { Request };
