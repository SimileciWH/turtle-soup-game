import { PrismaClient, Difficulty, PuzzleStatus } from '@prisma/client'

const prisma = new PrismaClient()

const puzzles = [
  {
    title: '电梯里的血迹',
    summary: '看到血迹却松了一口气，这是为什么？',
    surface: '一个人每天坐电梯上班，某天看到电梯里有血迹，却松了口气。为什么？',
    answer: '他是盲人，依赖导盲犬。看到血迹说明受伤的是狗而不是自己或家人，所以先松了口气。',
    facts: ['当事人是盲人', '他有一只导盲犬', '血迹来自导盲犬的伤', '他担心的是家人安全'],
    hint1: '和这个人的感官状态有关。',
    hint2: '他身边有一个重要的同伴。',
    hint3: '血迹的主人不是人类。',
    difficulty: Difficulty.EASY,
    isDaily: true,
    status: PuzzleStatus.ACTIVE
  },
  {
    title: '海边的脚印',
    summary: '只有走向大海的脚印，却没有回来的，人却平安无事。',
    surface: '海滩上只有一串向海里走去的脚印，却没人回来。后来人却平安无事。',
    answer: '那个人是倒着走进海里的，离开时顺着原路倒退回来，所以看起来像只有走向海里的脚印。',
    facts: ['脚印只有一个方向', '人实际上回来了', '行走方向与脚印方向可以相反'],
    hint1: '关键在脚印方向和行走方向的关系。',
    hint2: '人可以向后退着走。',
    hint3: '他离开时背对海洋走的。',
    difficulty: Difficulty.EASY,
    isDaily: false,
    status: PuzzleStatus.ACTIVE
  },
  {
    title: '半夜的电话',
    summary: '半夜接了个电话，却睡得更香了。',
    surface: '他半夜接了一个电话，听完后立刻睡得更香了。为什么？',
    answer: '电话是打错的。他因此确认了真正担心的事没有发生，于是安心睡着了。',
    facts: ['电话是误拨的', '他一直在担心某件事', '打错本身成了安慰'],
    hint1: '这通电话不是他期待的那通。',
    hint2: '打错电话这件事本身就是关键线索。',
    hint3: '他在等一通坏消息，而这通电话证明坏消息没来。',
    difficulty: Difficulty.MEDIUM,
    isDaily: false,
    status: PuzzleStatus.ACTIVE
  },
  {
    title: '消失的子弹',
    summary: '尸体中没有子弹，凶手却用枪杀了人。',
    surface: '法医在尸体上找到了枪伤，却没有找到子弹。凶手确实用枪杀了人，为什么没有子弹？',
    answer: '凶手用冰雕刻成子弹形状，射击后冰弹融化，所以留不下证据。',
    facts: ['子弹是冰做的', '冰在体内融化', '枪伤真实存在'],
    hint1: '子弹的材质不是金属。',
    hint2: '想想什么东西会消失。',
    hint3: '水在特定条件下会变成固体。',
    difficulty: Difficulty.HARD,
    isDaily: false,
    status: PuzzleStatus.ACTIVE
  },
  {
    title: '安静的图书馆',
    summary: '图书馆里发生了一声巨响，所有人却都没有抬头。',
    surface: '在一个安静的图书馆里发生了一声巨响，但所有在场的人都没有抬起头来。为什么？',
    answer: '所有人都是聋哑人，正在参加聋哑人专场读书会，所以没有人听到声音。',
    facts: ['在场者均为聋哑人', '这是专场活动', '他们感知不到声音'],
    hint1: '注意在场人员的特殊性。',
    hint2: '和听觉有关。',
    hint3: '这是一场特殊群体的专属活动。',
    difficulty: Difficulty.MEDIUM,
    isDaily: false,
    status: PuzzleStatus.ACTIVE
  }
]

const testRedeemCodes = [
  { code: 'TEST-0001', quotaValue: 10 },
  { code: 'TEST-0030', quotaValue: 30 },
  { code: 'TEST-0100', quotaValue: 100 }
]

async function main(): Promise<void> {
  console.log('开始填充题目数据...')

  for (const p of puzzles) {
    await prisma.puzzle.upsert({
      where: { title: p.title } as never,
      update: p,
      create: p
    })
    console.log(`  ✓ ${p.title}`)
  }

  console.log('填充测试兑换码...')
  for (const c of testRedeemCodes) {
    await prisma.redeemCode.upsert({
      where: { code: c.code },
      update: {},
      create: c
    })
    console.log(`  ✓ ${c.code}（${c.quotaValue} 局）`)
  }

  console.log(`完成，共填充 ${puzzles.length} 道题目 + ${testRedeemCodes.length} 个测试兑换码。`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
