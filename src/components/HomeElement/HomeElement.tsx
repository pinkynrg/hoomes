import Icon, { StarOutlined } from '@ant-design/icons';
import { Home } from '../../types';
import { Location } from './../Icons/Location';
import { PriceTag } from './../Icons/PriceTag';
import { M2 } from './../Icons/M2';
import { PriceMeter } from './../Icons/PriceMeter';
import style from './HomeElement.module.scss';
import classnames from 'classnames';
import { EuroFormatter, percentage } from '../../utils';
import { Button } from 'antd';

interface HomeElementProps {
  onPreview: (url: string) => void
  className?: string
  home: Home 
}

const HomeElement = ({
  onPreview,
  className,
  home,
}: HomeElementProps) => (
  <div className={classnames(style.Container, className)}>
    <div className={style.Image}> 
      <img src={home.image} alt="main_image"/> 
    </div>
    <div className={style.Content}>
      <div className={style.Header}>
        <h1 className={style.Title}> {home.title} </h1>
        <p className={style.Location}> 
          <Icon component={Location}/> 
          {home.location} 
        </p>
      </div>
      <div className={style.Spec}> 
        <span className={style.Price}> 
          <Icon component={PriceTag}/>
          {EuroFormatter.format(home.price)} 
        </span>
        <span className={style.Size}> 
          <Icon component={M2}/>
          {home.m2}m&sup2; 
        </span>
        <span className={style.PrimeMeter}> 
          <Icon component={PriceMeter}/>
          {EuroFormatter.format(home.price/home.m2)} Euro/m&sup2; 
        </span>
      </div>
      <div className={style.Footer}>
        <div className={style.Match}> 
          {percentage(home.match)}
        </div>
        <div className={style.Favorite} >
          <Button type="default" icon={<StarOutlined />}/>
        </div>
        <div className={style.Preview} >
          <Button type="primary" onClick={() => onPreview(home.url)}> Anteprima </Button>
        </div>
      </div>
    </div>
  </div>
);

export { HomeElement };