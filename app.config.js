import 'dotenv/config'

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      devToolsEnabled: process.env.EAS_DEV_TOOLS === '1',
    },
  }
}
