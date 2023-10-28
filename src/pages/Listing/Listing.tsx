import { EmptyState } from "../../components/EmptyState/EmptyState";
import { HomesList } from "../../components/HomesList/HomesList";
import style from './Listing.module.scss';
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { Home } from "../../types";
import { Navigate } from "react-router-dom";
import classnames from "classnames";

const Listing = () => {
  const [homes] = useLocalStorage<Home[]>('data', [])
  const [url, setUrl] = useSessionStorage<string | null>('url', null)

  if (homes.length === 0) {
    return <Navigate to="/request" replace />
  }

  return (
    <div className={classnames(style.Container, {
      [style.IsLoaded]: !!url
    })}>
      <HomesList 
        homes={homes} 
        className={style.HomesList} 
        onPreview={setUrl}
      />
      <EmptyState 
        className={classnames(style.EmptyState)} 
        href={url ? '/v1/proxy?url=' + url : undefined}
      />
    </div>
  )
}

export { Listing }