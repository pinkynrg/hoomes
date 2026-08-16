import classnames from 'classnames'
import { ExportOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import style from './EmptyState.module.scss'

interface EmptyStateProps {
  className?: string
  url?: string
}

const Illustration = () => (
  <svg width="140" height="112" viewBox="0 0 140 112" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="44" width="76" height="52" rx="6" fill="#fff" stroke="currentColor" strokeWidth="2" />
    <path d="M12 48 56 16l44 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="44" y="70" width="24" height="26" rx="3" fill="var(--brand-50)" stroke="currentColor" strokeWidth="2" />
    <circle cx="98" cy="56" r="20" fill="#fff" stroke="currentColor" strokeWidth="2" />
    <circle cx="98" cy="56" r="11" stroke="currentColor" strokeWidth="2" opacity=".45" />
    <path d="m113 71 12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const EmptyState = ({
  className,
  url,
}: EmptyStateProps) => {
  if (url) {
    return (
      <div className={classnames(style.Container, style.HasPreview, className)}>
        <div className={style.Toolbar}>
          <span className={style.ToolbarUrl}>{url.replace(/^https?:\/\//, '')}</span>
          <Button
            type="text"
            size="small"
            icon={<ExportOutlined />}
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Apri l&apos;originale
          </Button>
        </div>
        <iframe title="Anteprima annuncio" src={`/v1/proxy?url=${encodeURIComponent(url)}`} />
      </div>
    )
  }

  return (
    <div className={classnames(style.Container, className)}>
      <span className={style.Illustration}><Illustration /></span>
      <p className={style.Title}>Seleziona una casa</p>
      <p className={style.Text}>
        L’annuncio completo si apre qui accanto, senza lasciare Hoomes.
      </p>
    </div>
  )
}

export { EmptyState }
