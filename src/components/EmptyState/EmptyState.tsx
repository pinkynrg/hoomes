import Icon from '@ant-design/icons';
import style from './EmptyState.module.scss';
import classnames from 'classnames';
import { FlatFace } from '../Icons/FlatFace';

interface EmptyStateProps {
  className?: string
  href?: string
}

const EmptyState = ({
  className,
  href,
}: EmptyStateProps) => {

  const content = href ? 
    <iframe title="selected hoome" src={href}/> : 
    <>
      <div> <Icon component={FlatFace}/> </div>
      Seleziona una casa per vedere l’anteprima
    </>

  return (
    <div className={classnames(style.Container, className)}>
      { content }
    </div>
  )
};

export { EmptyState };