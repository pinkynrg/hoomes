import Icon, { ExpandAltOutlined, StarFilled, StarOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Button, Tooltip } from 'antd'
import { useState } from 'react'
import { Location } from '../Icons/Location'
import { M2 } from '../Icons/M2'
import { PriceMeter } from '../Icons/PriceMeter'
import style from './HomeElement.module.scss'
import { EuroFormatter, percentage } from '../../utils'
import { HomeWithMatch } from '../../types'

interface HomeElementProps {
  onPreview: (url: string) => void
  className?: string
  home: HomeWithMatch
  showMatch?: boolean
}

const HomeElement = ({
  onPreview,
  className,
  home,
  showMatch = false,
}: HomeElementProps) => {
  const [favorite, setFavorite] = useState(false)
  const pricePerMeter = home.m2 > 0 ? home.price / home.m2 : 0

  return (
    <article className={style.Wrapper}>
      <div className={classnames(style.Container, className)}>
        <div className={style.Image}>
          <img src={home.image} alt="" loading="lazy" />
          { home.source && <span className={style.Source}>{home.source}</span> }
          { showMatch && (
            <span className={classnames(style.Match, {
              [style.Good]: home.match >= 0.7,
              [style.Decent]: home.match < 0.7 && home.match >= 0.3,
              [style.Bad]: home.match < 0.3,
            })}
            >
              {percentage(home.match)}
              <small>affinità</small>
            </span>
          )}
        </div>
        <div className={style.Content}>
          <div className={style.Header}>
            <h3 className={style.Title}>{home.title}</h3>
            <p className={style.Location}>
              <Icon component={Location} />
              {home.location}
            </p>
          </div>

          <div className={style.Price}>
            {EuroFormatter.format(home.price)}
          </div>

          <div className={style.Spec}>
            <span className={style.SpecItem}>
              <Icon component={M2} />
              {`${home.m2} m²`}
            </span>
            { pricePerMeter > 0 && (
              <span className={style.SpecItem}>
                <Icon component={PriceMeter} />
                {`${EuroFormatter.format(pricePerMeter)}/m²`}
              </span>
            )}
          </div>

          <div className={style.Footer}>
            <Tooltip title={favorite ? 'Rimuovi dai preferiti' : 'Salva tra i preferiti'}>
              <Button
                type="text"
                className={classnames(style.Favorite, { [style.IsFavorite]: favorite })}
                icon={favorite ? <StarFilled /> : <StarOutlined />}
                onClick={() => setFavorite(!favorite)}
                aria-label="Preferito"
              />
            </Tooltip>
            <Button
              type="primary"
              className={style.Preview}
              icon={<ExpandAltOutlined />}
              onClick={() => onPreview(home.url)}
            >
              Anteprima
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export { HomeElement }
