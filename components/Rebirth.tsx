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
    time: '十月十六 · 生日清晨',
    title: '这一岁，从你睁眼开始',
    art: 'dawn',
    lines: [
      '日历上圈着你的生日。蜡烛还没点，蛋糕还没切，但今天已经是你的了。',
      '怎么过都可以。每条路最后都会把生日快乐送到你面前。',
    ],
    choices: [
      { text: '先为自己点一支蜡烛', to: 'bed' },
      { text: '出门去取生日蛋糕', to: 'street' },
      { text: '把生日告诉在乎的人', to: 'message' },
    ],
  },
  bed: {
    id: 'bed',
    time: '生日的第一支火',
    title: '烛火先于所有人到来',
    art: 'blanket',
    lines: [
      '你划亮火柴。小小的火苗站住了，房间里的影子都软下来。',
      '没有人唱，也没有人催。这支蜡烛只为你亮着。',
    ],
    choices: [
      { text: '闭上眼，许一个很小的愿', to: 'noodle' },
      { text: '先把生日歌放出来', to: 'song' },
    ],
  },
  noodle: {
    id: 'noodle',
    time: '许愿',
    title: '愿望说得很轻',
    art: 'kitchen',
    lines: [
      '你没有求很大的事。只求这一岁被好好对待，也被自己好好对待。',
      '吹气的时候火灭了，烟往上走。你笑了一下，像是愿望已经听见。',
    ],
    ending: '生日快乐。第一支蜡烛，被你自己吹灭了。',
  },
  song: {
    id: 'song',
    time: '生日歌',
    title: '歌先替大家唱给你',
    art: 'room',
    lines: [
      '生日快乐的旋律响起来。你跟着哼，走到「祝你生日快乐」时声音清楚了一点。',
      '唱完，蜡烛还在。你对着它点头，像收下了这首只属于今天的歌。',
    ],
    ending: '这一岁的第一首歌，是唱给你的生日。',
  },
  street: {
    id: 'street',
    time: '去取蛋糕',
    title: '路上已经有人在祝你',
    art: 'street',
    lines: [
      '店员看见订单上的日期，笑着说了句生日快乐。盒子被系上金色的绳。',
      '你抱着它往回走，蛋糕的甜味隔着纸盒也能闻见。',
    ],
    choices: [
      { text: '看看蛋糕上写了什么', to: 'shop' },
      { text: '再配上蜡烛和一束花', to: 'water' },
    ],
  },
  shop: {
    id: 'shop',
    time: '蛋糕盒',
    title: '奶油上写着生日快乐',
    art: 'shop',
    lines: [
      '字写得不算工整，但每个字都在。你用手指隔着盒子描了一遍。',
    ],
    choices: [
      { text: '今晚自己切第一刀', to: 'give' },
      { text: '留给要一起过生日的人', to: 'vase' },
    ],
  },
  give: {
    id: 'give',
    time: '一个人的生日桌',
    title: '第一刀切得很稳',
    art: 'kitchen',
    lines: [
      '你把蜡烛插上，又吹灭。奶油沾到指尖，甜得刚刚好。',
      '没有掌声也没关系。这一刀是你给自己的生日礼。',
    ],
    ending: '生日快乐。蛋糕的第一口，是你自己尝的。',
  },
  vase: {
    id: 'vase',
    time: '等人来',
    title: '蛋糕在灯下等你们',
    art: 'cafe',
    lines: [
      '门开的时候，有人先喊了生日快乐，然后才放下礼物。',
      '你们一起切。刀落下时，所有人都在笑，奶油被分到每只盘子里。',
    ],
    ending: '生日快乐。这一刀，是大家一起落下的。',
  },
  water: {
    id: 'water',
    time: '花和蜡烛',
    title: '生日要有光，也要有颜色',
    art: 'flower',
    lines: [
      '你挑了细细的蜡烛，又挑了一小束开得正好的花。店员把它们和蛋糕放在一起。',
    ],
    choices: [
      { text: '把花插在蛋糕旁边', to: 'shore' },
      { text: '把花送给第一个祝你生日快乐的人', to: 'ride' },
    ],
  },
  shore: {
    id: 'shore',
    time: '生日桌',
    title: '花靠着蛋糕',
    art: 'vase',
    lines: [
      '蜡烛点亮后，花瓣也被照暖了。你许愿，吹气，火光灭成一缕烟。',
      '房间里又甜又安静。这一桌是为你摆的。',
    ],
    ending: '生日快乐。光灭了，花还在。',
  },
  ride: {
    id: 'ride',
    time: '第一句祝福',
    title: '花交到那个人手里',
    art: 'flower',
    lines: [
      '对方刚说完生日快乐，你就把花递过去。两个人都愣了一下，然后一起笑。',
      '蛋糕还在你臂弯里。祝福和花，在同一分钟到达。',
    ],
    ending: '生日快乐。你把收到的祝愿，又还了一点出去。',
  },
  message: {
    id: 'message',
    time: '生日消息',
    title: '你告诉他们：今天是我的生日',
    art: 'phone',
    lines: [
      '消息发出去不久，屏幕就开始一下一下地亮。生日快乐四个字，从不同的人那里赶来。',
    ],
    choices: [
      { text: '把大家约来一起吹蜡烛', to: 'wait' },
      { text: '先自己把生日准备好', to: 'pocket' },
    ],
  },
  wait: {
    id: 'wait',
    time: '回复涌过来',
    title: '每条消息都在叫你的名字',
    art: 'phone',
    lines: [
      '有人问几点切蛋糕，有人说已经在路上，有人只发了一长串生日祝福。',
    ],
    choices: [
      { text: '今晚一起吹蜡烛', to: 'meet' },
      { text: '一条条回过去，把感谢说完', to: 'chat' },
    ],
  },
  meet: {
    id: 'meet',
    time: '生日夜',
    title: '蜡烛被大家围住',
    art: 'cafe',
    lines: [
      '灯关掉的那一秒，只剩烛火。生日歌有点不齐，但每个声音都在。',
      '你吹灭它们。黑暗里先响起掌声，然后灯又亮了，蛋糕被切开。',
    ],
    ending: '生日快乐。这一岁，是被很多人一起点亮的。',
  },
  chat: {
    id: 'chat',
    time: '对话框',
    title: '感谢比蜡烛先点完',
    art: 'phone',
    lines: [
      '你一条条回。有的回复很短，有的多说了几句近况。每发出去一句，生日就更完整一点。',
      '屏幕安静下来时，你知道这些祝福都会留到明天。',
    ],
    ending: '生日快乐。人没有到齐，祝愿已经到齐了。',
  },
  pocket: {
    id: 'pocket',
    time: '为自己过生日',
    title: '手机先放到一边',
    art: 'park',
    lines: [
      '祝福可以晚一点再看。你想先给这个生日留一个只有自己知道的仪式。',
    ],
    choices: [
      { text: '写一张只给自己的生日卡片', to: 'book' },
      { text: '戴上生日的心情，去走一圈', to: 'lap' },
    ],
  },
  book: {
    id: 'book',
    time: '生日卡片',
    title: '字是写给新的一岁的',
    art: 'book',
    lines: [
      '你写下：生日快乐。后面又加了一句，只有你看得懂。',
      '卡片夹进今天的日期里。明年翻到这一页，还会遇见它。',
    ],
    ending: '生日快乐。你给自己留了一张不会过期的祝词。',
  },
  lap: {
    id: 'lap',
    time: '生日游行',
    title: '这一圈，只为今天',
    art: 'park',
    lines: [
      '你走得很慢，像在游行。风把头发吹起来，你在心里给自己唱了一小段生日歌。',
      '回到门口时，蛋糕还在桌上等你。仪式可以很小，但必须是你的。',
    ],
    ending: '生日快乐。你用自己的脚步，把这一岁迎了进来。',
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
            <p className="mt-2 text-xs text-white/55">第 {path.length + 1} 幕 · 共 {endings} 种生日</p>
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
              再过一次这个生日
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
