import Icon from '@ant-design/icons'
import classnames from 'classnames'
import style from './EmptyState.module.scss'
import { FlatFace } from '../Icons/FlatFace'

interface EmptyStateProps {
  className?: string
  href?: string
}

const EmptyState = ({
  className,
  href,
}: EmptyStateProps) => {
  const content = href
    ? <iframe title="selected hoome" src={href} />
    : (
      <>
        <div>
          {' '}
          <Icon component={FlatFace} />
          {' '}
        </div>
        Seleziona una casa
        {' '}
        <br />
        per vedere l’anteprima
      </>
    )

  return (
    <div className={classnames(style.Container, className)}>
      { content }
    </div>
  )
}

export { EmptyState }
