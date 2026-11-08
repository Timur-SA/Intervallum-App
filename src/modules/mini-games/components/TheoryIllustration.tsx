import type { ReactNode } from 'react';
import type { TopicId } from '../domain/types';

function Label({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <text x={x} y={y} textAnchor="middle">{children}</text>;
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <g className="mg-lesson__arrow">
      <path d={`M${x1} ${y1} L${x2} ${y2}`} />
      <path d="M-7 -4 L0 0 L-7 4" transform={`translate(${x2} ${y2}) rotate(${angle})`} />
    </g>
  );
}

function Cart({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="mg-lesson__object" x="-15" y="-15" width="30" height="14" rx="3" />
      <circle cx="-9" cy="2" r="3" /><circle cx="9" cy="2" r="3" />
    </g>
  );
}

function Charge({ x, y, sign }: { x: number; y: number; sign: string }) {
  return (
    <g>
      <circle className="mg-lesson__object" cx={x} cy={y} r="14" />
      <Label x={x} y={y + 5}>{sign}</Label>
    </g>
  );
}

const diagrams: Record<TopicId, ReactNode> = {
  'uniform-motion': <>
    <path d="M25 88H295" />
    <Arrow x1={41} y1={37} x2={279} y2={37} />
    <Label x={160} y={25}>v = 3 м/с</Label>
    {[42, 121, 200, 279].map((x, i) => (
      <g key={x}>
        <Cart x={x} y={80} />
        <path d={`M${x} 88v6`} />
        <Label x={x} y={112}>{i * 3} м</Label>
        <Label x={x} y={132}>{i} с</Label>
      </g>
    ))}
  </>,
  relativity: <>
    <rect className="mg-lesson__object" x="46" y="37" width="228" height="62" rx="12" />
    <circle cx="133" cy="56" r="5" /><path d="M133 62v14m0-9l-7 5m7-5l7 3m-7 6l-6 10m6-10l8 9" />
    <Arrow x1={151} y1={72} x2={192} y2={72} />
    <Label x={213} y={77}>2 м/с</Label>
    <path d="M25 105H295" />
    <Arrow x1={60} y1={122} x2={208} y2={122} />
    <Label x={241} y={127}>10 м/с</Label>
  </>,
  'accelerated-motion': <>
    <path d="M28 100H292" />
    {[48, 151, 244].map((x, i) => (
      <g key={x}>
        <Cart x={x} y={92} />
        {i > 0 && <Arrow x1={x - 15} y1={60} x2={x - 15 + i * 27} y2={60} />}
        <Label x={x} y={42}>{i * 2} м/с</Label>
        <Label x={x} y={123}>{i} с</Label>
      </g>
    ))}
  </>,
  'free-fall': <>
    <path d="M113 16v112m-8 0h99" strokeDasharray="3 4" />
    {[22, 33, 67, 122].map((y, i) => (
      <g key={y}>
        <circle className="mg-lesson__object" cx="113" cy={y} r="4" />
        <Label x={76} y={y + (i === 0 ? -3 : 7)}>{i} с</Label>
      </g>
    ))}
    <Arrow x1={193} y1={34} x2={193} y2={104} />
    <Label x={237} y={74}>g ≈ 9,8 м/с²</Label>
  </>,
  momentum: <>
    <Label x={83} y={27}>До столкновения</Label>
    <Label x={240} y={27}>После</Label>
    <path d="M160 42v76" strokeDasharray="3 4" />
    <path d="M23 103h119m36 0h119" />
    <Cart x={48} y={94} /><Cart x={121} y={94} />
    <Cart x={224} y={94} /><Cart x={254} y={94} />
    <Arrow x1={32} y1={62} x2={96} y2={62} />
    <Arrow x1={218} y1={62} x2={252} y2={62} />
  </>,
  'mechanical-energy': <>
    <path d="M30 52h53c60 0 79 63 149 63h62" />
    <Cart x={57} y={45} /><Cart x={247} y={108} />
    <Label x={92} y={23}>Высоко, медленно</Label>
    <Label x={230} y={54}>Низко, быстро</Label>
    <Arrow x1={227} y1={79} x2={282} y2={79} />
  </>,
  'work-power': <>
    <path d="M31 104h258M31 42h258" strokeDasharray="3 4" />
    {[91, 229].map((x, i) => (
      <g key={x}>
        <rect className="mg-lesson__object" x={x - 14} y="27" width="28" height="15" rx="3" />
        <Arrow x1={x} y1={98} x2={x} y2={51} />
        <Label x={x} y={126}>{i === 0 ? 'за 2 с' : 'за 4 с'}</Label>
      </g>
    ))}
    <Label x={160} y={78}>2 м</Label>
  </>,
  lever: <>
    <path d="M37 78h243" strokeWidth="4" />
    <path className="mg-lesson__object" d="M108 80l-15 24h30z" />
    <Arrow x1={53} y1={20} x2={53} y2={69} />
    <Arrow x1={262} y1={44} x2={262} y2={69} />
    <Label x={82} y={34}>F₁</Label><Label x={239} y={51}>F₂</Label>
    <path d="M53 113h209M53 109v8m55-8v8m154-8v8" />
    <Label x={80} y={132}>l₁</Label><Label x={185} y={132}>l₂</Label>
  </>,
  density: <>
    {[91, 229].map((x, i) => (
      <g key={x}>
        <path className="mg-lesson__object" d={`M${x - 32} 49l18-18h46v46l-18 18h-46z`} />
        <path d={`M${x - 32} 49h46l18-18m-18 18v46`} />
        <Label x={x} y={118}>{i === 0 ? 'Вода · 1 кг' : 'Железо · 7,9 кг'}</Label>
      </g>
    ))}
    <Label x={160} y={18}>Равные объёмы по 1 л</Label>
  </>,
  'heat-amount': <>
    <Label x={160} y={22}>Оба сосуда нагрели на 10 °C</Label>
    {[86, 231].map((x, i) => (
      <g key={x}>
        <path className="mg-lesson__object" d={`M${x - 36} ${i === 0 ? 68 : 44}h72V95h-72z`} />
        <path d={`M${x - 36} 38v57h72V38`} />
        <Label x={x} y={83}>{i + 1} л</Label>
        <Label x={x} y={121}>{i === 0 ? 'Q' : '2Q'}</Label>
      </g>
    ))}
  </>,
  'aggregate-states': <>
    {[
      { x: 51, name: 'Лёд', dots: [[-12,-12],[0,-12],[12,-12],[-12,0],[0,0],[12,0],[-12,12],[0,12],[12,12]] },
      { x: 160, name: 'Вода', dots: [[-16,10],[-12,0],[-6,16],[-3,7],[1,-3],[7,16],[9,6],[15,-4],[18,14]] },
      { x: 269, name: 'Пар', dots: [[-18,-19],[-7,-22],[16,-16],[2,-7],[-13,0],[19,2],[-20,17],[-1,16],[15,20]] },
    ].map(({ x, name, dots }) => (
      <g key={name}>
        <rect className="mg-lesson__object" x={x - 32} y="39" width="64" height="58" rx="8" />
        {dots.map(([dx, dy]) => <circle key={`${dx}:${dy}`} className="mg-lesson__dot" cx={x + dx} cy={68 + dy} r="3" />)}
        <Label x={x} y={120}>{name}</Label>
      </g>
    ))}
    <Arrow x1={91} y1={68} x2={121} y2={68} />
    <Arrow x1={200} y1={68} x2={230} y2={68} />
  </>,
  'heat-balance': <>
    <rect className="mg-lesson__object" x="23" y="41" width="84" height="55" rx="8" />
    <rect className="mg-lesson__object" x="213" y="41" width="84" height="55" rx="8" />
    <Label x={65} y={74}>60 °C</Label><Label x={255} y={74}>20 °C</Label>
    <Arrow x1={119} y1={69} x2={200} y2={69} />
    <Label x={160} y={53}>Q</Label>
    <Label x={160} y={123}>При равных массах итог 40 °C</Label>
  </>,
  'thermal-energy': <>
    <path d="M104 28v91h112V28" />
    <path className="mg-lesson__object" d="M106 72h108v45H106z" />
    <path d="M106 65h108v7H106zM160 42v23" />
    <Arrow x1={160} y1={37} x2={160} y2={13} />
    <Arrow x1={52} y1={96} x2={94} y2={96} />
    <Label x={70} y={82}>Q</Label><Label x={160} y={102}>Газ</Label>
    <Label x={253} y={55}>Поршень</Label>
  </>,
  'fuel-engines': <>
    <rect className="mg-lesson__object" x="102" y="54" width="103" height="45" rx="8" />
    <Label x={154} y={81}>Двигатель</Label>
    <Arrow x1={26} y1={76} x2={91} y2={76} />
    <Label x={54} y={60}>100 Дж</Label>
    <Arrow x1={216} y1={76} x2={294} y2={76} />
    <Label x={255} y={47}>Работа</Label><Label x={255} y={62}>30 Дж</Label>
    <Arrow x1={154} y1={105} x2={154} y2={128} />
    <Label x={231} y={128}>70 Дж наружу</Label>
  </>,
  coulomb: <>
    <Label x={83} y={31}>Притяжение</Label><Label x={237} y={31}>Отталкивание</Label>
    <path d="M160 45v77" strokeDasharray="3 4" />
    <Charge x={43} y={84} sign="+" /><Charge x={123} y={84} sign="−" />
    <Charge x={213} y={84} sign="+" /><Charge x={261} y={84} sign="+" />
    <Arrow x1={61} y1={84} x2={79} y2={84} /><Arrow x1={105} y1={84} x2={87} y2={84} />
    <Arrow x1={195} y1={84} x2={173} y2={84} /><Arrow x1={279} y1={84} x2={301} y2={84} />
  </>,
  'charge-conservation': <>
    <Label x={78} y={31}>До переноса</Label><Label x={240} y={31}>После переноса</Label>
    <Charge x={49} y={75} sign="0" /><Charge x={107} y={75} sign="0" />
    <Arrow x1={128} y1={75} x2={183} y2={75} />
    <Charge x={211} y={75} sign="+" /><Charge x={269} y={75} sign="−" />
    <Label x={78} y={118}>Сумма 0</Label><Label x={240} y={118}>Сумма 0</Label>
  </>,
  resistance: <>
    <rect className="mg-lesson__object" x="36" y="37" width="85" height="12" rx="4" />
    <rect className="mg-lesson__object" x="36" y="89" width="170" height="12" rx="4" />
    <Label x={79} y={29}>l</Label><Label x={121} y={81}>2l</Label>
    <Label x={263} y={48}>R</Label><Label x={263} y={100}>2R</Label>
  </>,
  ohm: <>
    <path d="M124 102H50V42h83m54 0h83v60h-97m-49 0h21m11 0h17M145 88v28m11-23v18" />
    <rect className="mg-lesson__object" x="133" y="32" width="54" height="20" rx="2" />
    <Label x={160} y={24}>3 Ом</Label><Label x={151} y={133}>6 В</Label>
    <Arrow x1={63} y1={42} x2={113} y2={42} />
    <Label x={88} y={65}>2 А</Label>
  </>,
  'joule-lenz': <>
    <Label x={160} y={27}>Одно сопротивление, одно время</Label>
    <rect className="mg-lesson__object" x="98" y="49" width="40" height="19" rx="3" />
    <rect className="mg-lesson__object" x="98" y="90" width="160" height="19" rx="3" />
    <Label x={59} y={63}>I</Label><Label x={59} y={104}>2I</Label>
    <Label x={118} y={63}>Q</Label><Label x={178} y={104}>4Q</Label>
  </>,
  ampere: <>
    {[36, 77, 118].map(y => <Arrow key={y} x1={37} y1={y} x2={270} y2={y} />)}
    <circle className="mg-lesson__object" cx="160" cy="77" r="15" />
    <circle className="mg-lesson__dot" cx="160" cy="77" r="4" />
    <Arrow x1={160} y1={59} x2={160} y2={15} />
    <Label x={181} y={26}>F</Label><Label x={290} y={41}>B</Label>
    <Label x={185} y={94}>I</Label>
  </>,
};

export function TheoryIllustration({ topicId }: { topicId: TopicId }) {
  return (
    <svg className="mg-lesson__diagram" viewBox="0 0 320 144" aria-hidden="true">
      {diagrams[topicId]}
    </svg>
  );
}
