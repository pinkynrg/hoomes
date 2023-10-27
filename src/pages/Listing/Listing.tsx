import { useState } from "react";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { HomesList } from "../../components/HomesList/HomesList";
import style from './Listing.module.scss';

const Listing = () => {
  const [url, setUrl] = useState<string | undefined>()

  return (
    <div className={style.Container}>
      <HomesList className={style.HomesList} onPreview={setUrl}/>
      <EmptyState className={style.EmptyState} href={url ? '/v1/proxy?url=' + url : undefined}/>
    </div>
  )
}

export { Listing }