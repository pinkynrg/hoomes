import { Outlet } from 'react-router-dom'
import { useSessionStorage } from 'usehooks-ts'
import Icon from '@ant-design/icons'
import style from './Layout.module.scss'
import { Expander } from '../Icons/Expander'

const Layout = () => {
  const [url, setUrl] = useSessionStorage<string | null>('url', null)
  return (
    <div className={style.Layout}>
      <div className={style.Header}>
        <div className={style.Left}>
          { url
            ? (
              <span className={style.Expander} onClick={() => setUrl(null)}>
                <Icon component={Expander} />
                <span> Back </span>
              </span>
            )
            : null}
        </div>
        <div className={style.Center}>
          <h1>
            Hoomes
            <span>.</span>
          </h1>
        </div>
        <div className={style.Right} />
      </div>
      <div className={style.Body}>
        <Outlet />
      </div>
    </div>
  )
}

export { Layout }
