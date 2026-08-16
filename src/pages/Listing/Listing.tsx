import { useSessionStorage } from 'usehooks-ts'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Spin } from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../dbConfig'
import style from './Listing.module.scss'
import { HomesList } from '../../components/HomesList/HomesList'
import { EmptyState } from '../../components/EmptyState/EmptyState'

const Listing = () => {
  const [url, setUrl] = useSessionStorage<string | null>('url', null)
  const navigate = useNavigate()
  const homesCount = useLiveQuery(() => db.homes.count())

  useEffect(() => {
    if (homesCount === 0) {
      navigate('/request')
    }
  }, [homesCount, navigate])

  if (homesCount === undefined) {
    return (
      <div className={style.Loading}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={classnames(style.Container, {
      [style.IsLoaded]: !!url,
    })}
    >
      <HomesList
        className={style.HomesList}
        onPreview={setUrl}
      />
      <EmptyState
        className={style.EmptyState}
        url={url || undefined}
      />
    </div>
  )
}

export { Listing }
