import { Context, Schema } from 'koishi'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

export const name = 'enforce-debug-logging'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export async function apply(ctx: Context) {
  // 好像非开发环境本来也不会装这个
  // if (process.env.NODE_ENV !== 'development') return
  const logger = ctx.logger('enforce-debug-logging')
  // 没有测这个正则在非 windows 工不工作
  const workspace = /(.+)(external|node_modules)/.exec(__dirname)?.[1]
  const folders = await readdir(path.join(workspace, 'external'), { withFileTypes: true })
    .then(list => list.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name))
  const regex = /(@koishijs\/|koishi-plugin-)(.+)/
  const plugins = await Promise.all(folders.map(async folder => {
    const file = path.join(workspace, 'external', folder, 'package.json')
    const plugin = JSON.parse(await readFile(file, 'utf-8').catch(() => '{}'))
    const name = regex.exec(plugin.name ?? '')?.[2]
    return name
  }).filter(Boolean))
  plugins.forEach(plugin => {
    ctx.logger(plugin).level = 3
  })
  logger.info('enforced debug log level for: ' + plugins.join(', '))
}
