import {
  siAndroid,
  siApacheecharts,
  siCplusplus,
  siGit,
  siHtml5,
  siHuggingface,
  siJupyter,
  siLinux,
  siMysql,
  siOpenjdk,
  siPandas,
  siPostman,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siScrapy,
  siSqlite,
  siTypescript,
  siYolo,
} from 'simple-icons'

export interface ToolIconData {
  /** 24×24 视图下的 SVG path，用 currentColor 填充 */
  path: string
  title: string
  hex: string
}

/**
 * 显式登记用到的技术图标。
 *
 * 不做「运行时按 slug 动态查找」——那需要把整套图标打进包里；
 * 显式具名导入才能让打包器把没用到的品牌图标全部裁掉。
 */
export const toolIcons: Record<string, ToolIconData> = {
  cplusplus: siCplusplus,
  python: siPython,
  typescript: siTypescript,
  mysql: siMysql,
  openjdk: siOpenjdk,
  react: siReact,
  html5: siHtml5,
  apacheecharts: siApacheecharts,
  android: siAndroid,
  postgresql: siPostgresql,
  sqlite: siSqlite,
  postman: siPostman,
  pytorch: siPytorch,
  yolo: siYolo,
  huggingface: siHuggingface,
  jupyter: siJupyter,
  scrapy: siScrapy,
  pandas: siPandas,
  git: siGit,
  linux: siLinux,
}
