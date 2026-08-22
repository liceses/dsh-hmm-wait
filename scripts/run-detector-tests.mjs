// dsh-hmm-wait — detector regression tests (node --input-type=module tests/run-detector-tests.mjs)
import { createDetector } from '../src/detect.ts'

const mk = (over) =>
  createDetector({ triggers: ['hmm', 'wait', 'let me'], match: 'sentence-start', caseSensitive: false, cooldownMs: 0, maxPerSecond: 100, maxChars: 80, ...over })

const t = (name, chunks, over) => {
  const d = mk(over ?? {})
  const hits = chunks.map((c) => d.push(c)).filter((h) => h.length > 0)
  console.log(name.padEnd(28), JSON.stringify(hits))
}

let failures = 0
const expect = (name, actual, wanted) => {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`.padEnd(28), JSON.stringify(actual), ok ? '' : ` expected ${JSON.stringify(wanted)}`)
}

// 回归：边界在触发词之后（句号），不得误判句首
const d1 = mk()
expect('R1 wait后句号', d1.push('注意 wait。然后'), [])
// 句中 wait 不得命中
const d2 = mk()
expect('R2 句中', d2.push('好的，注意 wait，我看看'), [])
// 正常句首
const d3 = mk()
expect('R3 句首', d3.push('明白了。wait，我再想想'), [{ trigger: 'wait', text: 'wait，我再想想' }])
// 换行句首
const d4 = mk()
expect('R4 换行', d4.push('第一步完成。\nwait a second，好了'), [{ trigger: 'wait', text: 'wait a second，好了' }])
// 流式拆词
const d5 = mk()
expect('R5a 拆词前', d5.push('hm'), [])
expect('R5b 拆词后', d5.push('m, let me check'), [{ trigger: 'hmm', text: 'hmm, let me check' }])
// 中文句子后英文句首
const d6 = mk()
expect('R6 中文后', d6.push('好的，我来分析。\nHmm, actually'), [{ trigger: 'hmm', text: 'Hmm, actually' }])
// anywhere
const d7 = mk({ match: 'anywhere' })
expect('R7 anywhere', d7.push('I thought hmm about it'), [{ trigger: 'hmm', text: 'I thought hmm about it' }])
// await 不触发 wait
const d8 = mk({ match: 'anywhere' })
expect('R8 await', d8.push('we await the result'), [])
// 中文引号句首（句子从引号开始）
const d9 = mk()
expect('R9 引号', d9.push('“wait，让我想想”'), [{ trigger: 'wait', text: '“wait，让我想想”' }])
// 同句两个触发词（chunk 内先后）
const d10 = mk()
expect('R10 双词', d10.push('hmm, wait a moment'), [{ trigger: 'hmm', text: 'hmm, wait a moment' }])
// 冷却
const d11 = mk({ cooldownMs: 100000 })
expect('R11a 冷却1', d11.push('wait one'), [{ trigger: 'wait', text: 'wait one' }])
expect('R11b 冷却2', d11.push('wait two'), [])
// 限流
const d12 = mk({ maxPerSecond: 1 })
expect('R12a 限流1', d12.push('wait one'), [{ trigger: 'wait', text: 'wait one' }])
expect('R12b 限流2', d12.push('wait two'), [])
// 触发词为中文
const d13 = createDetector({ triggers: ['嗯'], match: 'sentence-start', caseSensitive: false, cooldownMs: 0, maxPerSecond: 10, maxChars: 40 })
expect('R13 中文词', d13.push('好的，接下来。嗯，我想想'), [{ trigger: '嗯', text: '嗯，我想想' }])
// 防膨胀长流
const d14 = mk()
let long = '这是一段很长的推理文本，没有任何触发词。'.repeat(50)
expect('R14 长流', d14.push(long), [])
// 段落开头（缩进空白）
const d15 = mk()
expect('R15 缩进', d15.push('   wait，缩进开头'), [{ trigger: 'wait', text: 'wait，缩进开头' }])

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
