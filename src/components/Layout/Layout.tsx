import { Outlet, useLocation } from 'react-router-dom'
import { useSessionStorage } from 'usehooks-ts'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import style from './Layout.module.scss'
import { Logo } from '../Icons/Logo'

const Layout = () => {
  const [url, setUrl] = useSessionStorage<string | null>('url', null)
  const { pathname } = useLocation()
  const isListing = pathname.startsWith('/listing') && pathname === '/listing'

  return (
    <div className={style.Layout}>
      <header className={style.Header}>
        <div className={style.Left}>
          { url && (
            <Button
              className={style.Back}
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setUrl(null)}
            >
              Indietro
            </Button>
          )}
        </div>
        <div className={style.Center}>
          <span className={style.Brand}>
            <span className={style.Mark}><Logo /></span>
            <span className={style.Wordmark}>
              Hoomes
              <span className={style.Dot}>.</span>
            </span>
          </span>
        </div>
        <div className={style.Right}>
          { isListing && (
            <span className={style.Tagline}>Case in Italia, cercate a parole tue</span>
          )}
        </div>
      </header>
      <main className={style.Body}>
        <Outlet />
      </main>
    </div>
  )
}

export { Layout }
