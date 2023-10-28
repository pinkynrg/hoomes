import { useState } from "react";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { HomesList } from "../../components/HomesList/HomesList";
import style from './Listing.module.scss';
import { useLocalStorage } from "usehooks-ts";
import { Home } from "../../types";
import { Navigate } from "react-router-dom";

const Listing = () => {
  const [homes] = useLocalStorage<Home[]>('data', [])
  const [url, setUrl] = useState<string | undefined>()

  if (homes.length === 0) {
    return <Navigate to="/request" replace />
  }

  return (
    <div className={style.Container}>
      <HomesList 
        homes={homes} 
        className={style.HomesList} 
        onPreview={setUrl}
      />
      <EmptyState 
        className={style.EmptyState} 
        href={url ? '/v1/proxy?url=' + url : undefined}
      />
    </div>
  )
}

export { Listing }