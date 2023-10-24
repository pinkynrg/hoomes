import { useLocalStorage } from 'usehooks-ts';
import style from './Loader.module.scss';
import classnames from 'classnames';

interface LoaderProps {
  className?: string
}

const Loader = ({
  className,
}: LoaderProps) => {

  const [data, setData] = useLocalStorage('data',{})

  return (
    <div className={classnames(style.Container, className)}>
      {/* Your component content here */}
    </div>
  )
};

export { Loader };
