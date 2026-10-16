import React, { useMemo, useRef, useState } from 'react';

type Choice = { text: string; to: string };
type Scene = {
  id: string;
  time: string;
  title: string;
  lines: string[];
  art: string;
  choices?: Choice[];
  ending?: string;
};

const SCENES: Record<string, Scene> = {
  wake: {
    id: 'wake',
    time: '十月十六 · 清晨',
    title: '你又回到了今天',
    art: 'dawn',
    lines: [
      '闹钟还没响。光先从窗帘缝里进来，落在你手背上。',
      '日历被轻轻圈住。这一天可以慢慢过，每一条路都会把你好好送出去。',
    ],
    choices: [
      { text: '再躺十分钟', to: 'bed' },
      { text: '拉开窗帘出门', to: 'street' },
      { text: '先把一句想说的话发出去', to: 'message' },
    ],
  },
  bed: {
    id: 'bed',
    time: '被窝里',
    title: '世界先不急着叫你',
    art: 'blanket',
    lines: [
      '你把被子拉高一点。房间里只有呼吸和很轻的灰尘。',
      '十分钟变成刚刚好的一段空白。起来的时候，肩膀是松的。',
    ],
    choices: [
      { text: '给自己煮一碗热的', to: 'noodle' },
      { text: '把喜欢的歌放到刚好能听见', to: 'song' },
    ],
  },
  noodle: {
    id: 'noodle',
    time: '厨房',
    title: '热气先到',
    art: 'kitchen',
    lines: [
      '水开得比预想快。面在锅里慢慢变软，葱花是最后才落下的。',
      '你靠着桌沿吃完。窗外有人笑了一声，像是替今天鼓掌。',
    ],
    ending: '这一岁从一碗热的开始。很好。',
  },
  song: {
    id: 'song',
    time: '自己的房间',
    title: '歌先替你醒过来',
    art: 'room',
    lines: [
      '前奏一起来，地板都好像亮了一点。你没跳舞，只是跟着点了点头。',
      '唱到喜欢的那句时，你跟着哼了出来。没人听见也没关系，房间听见了。',
    ],
    ending: '今天的第一首歌，是唱给你自己的。',
  },
  street: {
    id: 'street',
    time: '街上',
    title: '风是顺的',
    art: 'street',
    lines: [
      '出门的时候刚好没下雨。树影在地上慢慢挪，像给你让路。',
      '你走得不算快。每个路口的灯，都在你到的时候变绿。',
    ],
    choices: [
      { text: '拐进一家没去过的小店', to: 'shop' },
      { text: '一直走到能看见水的地方', to: 'water' },
    ],
  },
  shop: {
    id: 'shop',
    time: '小店',
    title: '柜台上有一束不贵的花',
    art: 'shop',
    lines: [
      '老板把花递过来时说，今天的都开得很好。你摸了摸最外面那片叶子，是凉的。',
    ],
    choices: [
      { text: '送给路上碰到的人', to: 'give' },
      { text: '自己带回家，插进瓶子', to: 'vase' },
    ],
  },
  give: {
    id: 'give',
    time: '街角',
    title: '花找到了别人的手里',
    art: 'flower',
    lines: [
      '你把花递给一个正低头看路的人。对方愣了一下，然后笑得比花还亮。',
      '你空着手往回走，口袋里却像装着刚才那一下笑。',
    ],
    ending: '有些好运，送出去之后还会跟着你。',
  },
  vase: {
    id: 'vase',
    time: '窗台',
    title: '瓶子刚好够高',
    art: 'vase',
    lines: [
      '回家后你洗了瓶子，把花枝剪齐。水漫过切口的时候，房间就有了味道。',
      '你坐下来看了很久。它们会再开几天，而今天已经算数了。',
    ],
    ending: '你把自己的日子，也插进了光里。',
  },
  water: {
    id: 'water',
    time: '车上',
    title: '窗外的城市慢慢变矮',
    art: 'train',
    lines: [
      '你坐在靠窗的位置。有人在后座睡着了，呼吸很稳。',
      '快到的时候，水面先出现，像一块被擦亮的银。',
    ],
    choices: [
      { text: '下车，走到水边', to: 'shore' },
      { text: '不下车，看完这一程再回来', to: 'ride' },
    ],
  },
  shore: {
    id: 'shore',
    time: '水边',
    title: '鞋子沾了一点潮',
    art: 'shore',
    lines: [
      '风比街上大，但是暖的。你把手指伸进水里，凉意只停了一秒。',
      '返回的路上你买了热饮。杯壁烫手，刚好能把刚才的风记住。',
    ],
    ending: '你看见了比日常更宽的一块地方。这就够了。',
  },
  ride: {
    id: 'ride',
    time: '回程',
    title: '座位还是你的',
    art: 'train',
    lines: [
      '你没有下去。车继续开，水光从窗上滑走，像一场不必停留的电影。',
      '回到熟悉的站时，天还很亮。你觉得自己出门过，也回家了。',
    ],
    ending: '有的风景，看过就已经属于你。',
  },
  message: {
    id: 'message',
    time: '对话框',
    title: '那句话发出去了',
    art: 'phone',
    lines: [
      '你打了又删，最后只留下很短的一句。发送键按下去的时候，心跳比平时清楚。',
    ],
    choices: [
      { text: '等一等，看对方怎么回', to: 'wait' },
      { text: '先把手机扣上，去过自己的上午', to: 'pocket' },
    ],
  },
  wait: {
    id: 'wait',
    time: '几分钟后',
    title: '回复来得比想象快',
    art: 'phone',
    lines: [
      '屏幕亮了。对方回得认真，还多问了一句：今天想怎么过？',
    ],
    choices: [
      { text: '约出来见面', to: 'meet' },
      { text: '就把这句话留在对话框里', to: 'chat' },
    ],
  },
  meet: {
    id: 'meet',
    time: '约定的地方',
    title: '人先到了，笑也先到了',
    art: 'cafe',
    lines: [
      '你们没谈什么大事。杯子碰了一下，糖纸被折成很小的一艘船。',
      '分开的时候对方说，明年也要记得这一天。你点头，知道自己会记得。',
    ],
    ending: '有人把你的日子，当成自己的日子来过。',
  },
  chat: {
    id: 'chat',
    time: '屏幕这边',
    title: '话停在刚好的地方',
    art: 'phone',
    lines: [
      '你没有再约。对话框安静下来，可那种被接住的感觉还在。',
      '你把手机放进口袋，去做下一件小事。步子比早上轻。',
    ],
    ending: '没见面也没关系。你们已经把今天说成了好日子。',
  },
  pocket: {
    id: 'pocket',
    time: '上午',
    title: '手机先休息',
    art: 'park',
    lines: [
      '你把手机扣在桌上，走出门。世界没有因此少掉什么，反而更大了一点。',
    ],
    choices: [
      { text: '去书店站着看一章', to: 'book' },
      { text: '在空地上慢慢走一圈', to: 'lap' },
    ],
  },
  book: {
    id: 'book',
    time: '书店',
    title: '刚好翻到喜欢的一页',
    art: 'book',
    lines: [
      '你没买。那一页被你站着读完，店员没有催。纸的味道很干，很干净。',
      '出来时阳光正好打在台阶上。你觉得这句话可以陪你走一段路。',
    ],
    ending: '有的句子不用带回家，也会跟着你。',
  },
  lap: {
    id: 'lap',
    time: '空地',
    title: '走完一圈，风也走完一圈',
    art: 'park',
    lines: [
      '你没有跑。只是把步子放稳，看自己的影子从短变长，又从长变短。',
      '回到起点时，胸口是热的。今天被你用脚量过了。',
    ],
    ending: '你把这一圈，走成了自己的庆典。',
  },
};

const BIRTHDAY_NOTES: Array<[number, number]> = [
  [262, 0.32], [262, 0.2], [294, 0.5], [262, 0.5], [349, 0.5], [330, 0.9],
  [262, 0.32], [262, 0.2], [294, 0.5], [262, 0.5], [392, 0.5], [349, 0.9],
  [262, 0.32], [262, 0.2], [523, 0.5], [440, 0.5], [349, 0.5], [330, 0.5], [294, 0.9],
  [466, 0.32], [466, 0.2], [440, 0.5], [349, 0.5], [392, 0.5], [349, 1.1],
];

function createPlayer() {
  let ctx: AudioContext | null = null;
  let timer = 0;
  let playing = false;
  const playNote = (frequency: number, when: number, duration: number) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.05, when + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  };
  const loop = () => {
    if (!playing || !ctx) return;
    let when = ctx.currentTime + 0.06;
    BIRTHDAY_NOTES.forEach(([frequency, duration]) => {
      playNote(frequency, when, duration * 0.9);
      when += duration;
    });
    timer = window.setTimeout(loop, Math.max(300, (when - ctx.currentTime) * 1000 - 60));
  };
  return {
    async start() {
      if (!ctx) ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      if (playing) return;
      playing = true;
      loop();
    },
    stop() {
      playing = false;
      window.clearTimeout(timer);
    },
  };
}

const Rebirth: React.FC = () => {
  const [id, setId] = useState('wake');
  const [path, setPath] = useState<string[]>([]);
  const [musicOn, setMusicOn] = useState(false);
  const playerRef = useRef<ReturnType<typeof createPlayer> | null>(null);
  if (!playerRef.current) playerRef.current = createPlayer();
  const scene = SCENES[id];
  const endings = useMemo(() => Object.values(SCENES).filter((item) => item.ending).length, []);

  const choose = (choice: Choice) => {
    setPath((prev) => [...prev, choice.text]);
    setId(choice.to);
  };

  const restart = () => {
    setPath([]);
    setId('wake');
  };

  const toggleMusic = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (musicOn) {
      player.stop();
      setMusicOn(false);
      return;
    }
    await player.start();
    setMusicOn(true);
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#0c1418] text-[#f3eadc]">
      <div className={`scene scene-${scene.art}`} aria-hidden="true" />
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.35em] text-[#e7c98a]">{scene.time}</p>
            <p className="mt-2 text-xs text-white/55">第 {path.length + 1} 幕 · 共 {endings} 种好日子</p>
          </div>
          <button
            type="button"
            onClick={toggleMusic}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs tracking-widest ${
              musicOn ? 'border-[#e7c98a] bg-[#e7c98a] text-[#1b140c]' : 'border-white/20 bg-black/30'
            }`}
          >
            {musicOn ? '关闭音乐' : '背景音乐'}
          </button>
        </header>

        <article key={scene.id} className="scene-card">
          <h1 className="font-serif text-4xl leading-tight tracking-wide sm:text-5xl">{scene.title}</h1>
          {scene.lines.map((line) => (
            <p key={line} className="mt-4 text-base leading-8 text-[#f6efe4]/90">
              {line}
            </p>
          ))}
          {scene.ending && (
            <p className="mt-6 border-t border-[#e7c98a]/40 pt-4 text-lg text-[#e7c98a]">{scene.ending}</p>
          )}
        </article>

        <div className="mt-6 grid gap-3">
          {scene.choices?.map((choice) => (
            <button
              key={choice.text}
              type="button"
              onClick={() => choose(choice)}
              className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-left text-base leading-7 backdrop-blur-md transition active:scale-[0.99] hover:border-[#e7c98a]/70"
            >
              {choice.text}
            </button>
          ))}
          {scene.ending && (
            <button
              type="button"
              onClick={restart}
              className="rounded-2xl bg-[#e7c98a] px-4 py-4 text-base text-[#1b140c]"
            >
              再活一次今天
            </button>
          )}
        </div>

        {path.length > 0 && (
          <p className="mt-6 text-xs leading-6 text-white/45">你走过：{path.join(' → ')}</p>
        )}
      </main>
      <style>{`
        .font-serif { font-family: "Songti SC", "Noto Serif SC", "STSong", serif; }
        .scene {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }
        .scene::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(12,20,24,0.15), rgba(12,20,24,0.72) 55%, #0c1418);
        }
        .scene-dawn { background: radial-gradient(circle at 50% 20%, #f0c27a, #c45c4a 28%, #102028 70%); }
        .scene-blanket { background: radial-gradient(circle at 30% 40%, #f4e1c1, #8c5a3c 40%, #1a1412 75%); }
        .scene-kitchen { background: radial-gradient(circle at 70% 30%, #ffe0a3, #e07a3d 35%, #24160f 72%); }
        .scene-room { background: radial-gradient(circle at 40% 30%, #f7d7e8, #6d4b7a 40%, #15141c 75%); }
        .scene-street { background: radial-gradient(circle at 50% 10%, #fff1c9, #7ea0b8 32%, #1b2830 70%); }
        .scene-shop { background: radial-gradient(circle at 60% 40%, #ffd0c2, #c45c6a 38%, #241418 74%); }
        .scene-flower { background: radial-gradient(circle at 50% 45%, #ffe7a8, #e07a78 36%, #1c2420 72%); }
        .scene-vase { background: radial-gradient(circle at 50% 60%, #f6edd9, #8aa37b 42%, #152018 76%); }
        .scene-train { background: linear-gradient(90deg, #d7e4ef 0 18%, #24343f 18% 100%); }
        .scene-shore { background: radial-gradient(circle at 50% 70%, #f2efe4, #6aa7c1 34%, #102028 70%); }
        .scene-phone { background: radial-gradient(circle at 50% 40%, #f7f1e4, #355c74 36%, #101820 74%); }
        .scene-cafe { background: radial-gradient(circle at 40% 35%, #f6d7a8, #a8643a 40%, #23160f 74%); }
        .scene-park { background: radial-gradient(circle at 50% 20%, #fff4d2, #6f8f62 36%, #142018 72%); }
        .scene-book { background: radial-gradient(circle at 35% 40%, #f4e7cf, #8d6244 42%, #1a1410 76%); }
        .scene-card { animation: rise 0.45s ease; }
        @keyframes rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default Rebirth;
