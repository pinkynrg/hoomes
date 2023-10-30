import { EmptyState } from "../../components/EmptyState/EmptyState";
import { HomesList } from "../../components/HomesList/HomesList";
import style from './Listing.module.scss';
import { useSessionStorage } from "usehooks-ts";
import classnames from "classnames";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../dbConfig";
import { Spin } from "antd";

const Listing = () => {
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useSessionStorage<string | null>('url', null)
  const navigate = useNavigate();

  useEffect(() => {
    db.homes.count().then(coutner => {
      setLoading(false)
      if (coutner === 0) {
        navigate('/request')
      }
    })
  }) 

  return (
      <div className={classnames(style.Container, {
        [style.IsLoaded]: !!url
      })}>
        {
          loading ?
          <Spin size='large'/> :
          <> 
            <HomesList 
              className={style.HomesList} 
              onPreview={setUrl}
            />
            <EmptyState 
              className={classnames(style.EmptyState)} 
              href={url ? '/v1/proxy?url=' + url : undefined}
            />
          </>
        }
      </div>
  )
}

export { Listing }