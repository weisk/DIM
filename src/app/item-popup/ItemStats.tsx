import React from 'react';
import { DimItem, DimStat, D1Stat } from '../inventory/item-types';
import classNames from 'classnames';
import { t } from 'app/i18next-t';
import './ItemStats.scss';
import { getColor, percent } from '../shell/filters';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from '../dim-ui/ExternalLink';
import _ from 'lodash';

export default function ItemStats({
  item,
  /** Another item to compare stats against. Usually the equipped item. */
  compareItem
}: {
  item: DimItem;
  compareItem?: DimItem;
}) {
  if (!item.stats || !item.stats.length) {
    return null;
  }

  const compareStatsByStatHash = compareItem
    ? _.keyBy(compareItem.stats, (stat) => stat.statHash)
    : {};

  return (
    <div className="stats">
      {item.stats.map((stat) => (
        <ItemStatRow
          key={stat.statHash}
          stat={stat}
          item={item}
          compareStat={compareStatsByStatHash[stat.statHash]}
        />
      ))}

      {item.isDestiny1() && item.quality && item.quality.min && (
        <div className="stat-box-row">
          <span className="stat-box-text stat-box-cell stat-box-wrap">{t('Stats.Quality')}</span>
          <span className="stat-box-cell stat-box-wrap" style={getColor(item.quality.min, 'color')}>
            {t('Stats.OfMaxRoll', { range: item.quality.range })}
          </span>
          <ExternalLink
            href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is"
            title={t('Stats.PercentHelp')}
          >
            <AppIcon icon={helpIcon} />
          </ExternalLink>
        </div>
      )}
    </div>
  );
}

function ItemStatRow({
  stat,
  item,
  compareStat
}: {
  stat: DimStat;
  item: DimItem;
  compareStat?: DimStat;
}) {
  const value = stat.value || 0;
  const compareStatValue = (compareStat ? compareStat.value : 0) || 0;
  // lower # is better for drawtime and chargetime stats
  const lowerBetter = [447667954, 2961396640].includes(stat.statHash);
  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;
  const higherLowerClasses = {
    'higher-stats': lowerBetter
      ? value < compareStatValue && compareStat
      : value > compareStatValue && compareStat,
    'lower-stats': lowerBetter
      ? value > compareStatValue && compareStat
      : value < compareStatValue && compareStat
  };

  let baseBar = compareStat ? Math.min(compareStatValue, value) : value;
  if (isMasterworkedStat && masterworkValue > 0) {
    baseBar -= masterworkValue;
  }

  const segments: [number, string?][] = [[baseBar]];

  if (isMasterworkedStat && masterworkValue > 0) {
    segments.push([masterworkValue, 'masterwork-stats']);
  }

  if (compareStat) {
    if (compareStatValue > value) {
      segments.push([compareStatValue - value, 'lower-stats']);
    } else if (value > compareStatValue) {
      segments.push([value - compareStatValue, 'higher-stats']);
    }
  }

  return (
    <div className="stat-box-row">
      <span
        className={classNames('stat-box-text', 'stat-box-cell', {
          'stat-box-masterwork': isMasterworkedStat
        })}
      >
        {stat.name}
      </span>

      {stat.statHash === 2715839340 ? (
        <span className="stat-recoil">
          <RecoilStat stat={stat} />
        </span>
      ) : (
        <span className={classNames('stat-box-outer', { 'stat-box-outer--no-bar': !stat.bar })}>
          <span className="stat-box-container">
            {stat.bar ? (
              segments.map(([val, className], index) => (
                <span
                  key={index}
                  className={classNames('stat-box-inner', className)}
                  style={{ width: percent(val / stat.maximumValue) }}
                />
              ))
            ) : (
              <span className={classNames(higherLowerClasses)}>{value}</span>
            )}
          </span>
        </span>
      )}

      {stat.bar && (
        <span className={classNames('stat-box-val', 'stat-box-cell', higherLowerClasses)}>
          {value}
          {isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min && (
            <span
              className="item-stat-quality"
              style={getColor(stat.qualityPercentage.min, 'color')}
            >
              ({stat.qualityPercentage.range})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}

function RecoilStat({ stat }: { stat: DimStat }) {
  const val = stat.value || 0;
  // A value from 100 to -100 where positive is right and negative is left
  // See https://imgur.com/LKwWUNV
  const direction =
    Math.sin((val + 5) * ((2 * Math.PI) / 20)) * (100 - val) * (Math.PI / 180) * 0.75;

  const x = 5 * Math.sin(direction);
  const y = 5 * Math.cos(direction);

  return (
    <svg height="12" viewBox="0 0 10 5">
      <circle r={5} cx={5} cy={5} fill="#333" />
      <line x1={5 - x} y1={5 + y} x2={5 + x} y2={5 - y} stroke="white" />
    </svg>
  );
}
