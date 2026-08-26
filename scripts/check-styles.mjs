// 检查 styles.ts 模板字符串健康度
import { readFileSync } from 'node:fs'

const src = readFileSync('src/client/styles.ts', 'utf8')
const backticks = (src.match(/`/g) ?? []).length
console.log('反引号数量（应为 2）:', backticks)
const dollar = src.match(/\$\{/g)
console.log('模板插值出现:', dollar)
const opens = (src.match(/\{/g) ?? []).length
const closes = (src.match(/\}/g) ?? []).length
console.log('花括号配平:', opens, closes)

// 提取 CSS 字符串主体（两个反引号之间），验证长度与收尾
const start = src.indexOf('`')
const end = src.lastIndexOf('`')
const css = src.slice(start + 1, end)
console.log('CSS 长度:', css.length)
console.log('CSS 结尾:', JSON.stringify(css.slice(-80)))
console.log('CSS 开头:', JSON.stringify(css.slice(0, 80)))
