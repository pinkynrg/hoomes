import axios from 'axios';
import style from './Request.module.scss';
import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { Location, RequestResponse } from './../../types';
import { useLocalStorage } from 'usehooks-ts';
import { TreeSelect } from 'antd';
import { Button } from 'antd';
import { Navigate } from 'react-router-dom';

interface RequestProps {
  className?: string
}

interface TreeSelectCity {
  value: string,
  title: string,
  children?: TreeSelectCity[]
}

const Request = ({
  className,
}: RequestProps) => {
  const [citiesTree, setCitiesTree] = useLocalStorage<TreeSelectCity[]>('location', [])
  const [request, setRequest] = useLocalStorage<string | null>('requestUUID', null)
  const [error, setError] = useState<string | null>(null)
  const [codes, setCodes] = useState(null)

  const handleRequest = () => {
    axios.post<RequestResponse>(`/v1/request`, { codes }).then(response => {
      if (response.data.jobs_id) {
        setRequest(response.data.jobs_id.join(','))
      }
    }).catch(() => {
      setError("C'e' stato un errore. Prova a selezionare meno citta'.")
    })
  }

  useEffect(() => {
    axios.get<Location[]>(`/v1/locations`).then(response => {
      const dataTree = response.data
        .filter(value => value.nome === value.provincia_nome)
        .map(province => ({
          value: `${province.codice}!`,
          title: province.nome,
          children: response.data.filter(city => city.provincia_nome === province.nome)
            .map(city => ({
              value: city.codice,
              title: city.nome,
            }))
        })
      )
      setCitiesTree(dataTree)
    }).catch(e => {
      console.error(`there was an error fetching the data: ${e}`)
    })
  }, [setCitiesTree])

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
        { error && <span className={style.Error}> { error } </span> }
        <TreeSelect
          allowClear
          showSearch
          multiple
          treeCheckable
          filterTreeNode={(inputValue: string, treeNode: any) => {
            const toLower = inputValue.toLowerCase()
            return treeNode.title.toLowerCase().includes(toLower)}
          }
          maxTagCount={3}
          autoClearSearchValue={false}
          showCheckedStrategy='SHOW_CHILD'
          style={{ width: '100%' }}
          onChange={setCodes}
          placeholder="Seleziona una cittá"
          treeData={citiesTree}
          disabled={citiesTree.length === 0}
        />
        <Button 
          disabled={!codes}
          onClick={handleRequest}
        > 
          Vai!
        </Button>
      </div>
    </div>
  )
}

export { Request };
