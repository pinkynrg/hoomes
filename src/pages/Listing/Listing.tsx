import { useState } from "react";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { HomesList } from "../../components/HomesList/HomesList";
import style from './Listing.module.scss';

const Listing = () => {
  const [url, setUrl] = useState<string | undefined>()

  return (
    <div className={style.Container}>
      <HomesList className={style.HomesList} onPreview={setUrl}/>
      <EmptyState href={url ? 'http://localhost:5000/v1/proxy?url=' + url : undefined}/>
    </div>
  )
}

export { Listing }