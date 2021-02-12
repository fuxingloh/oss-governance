import * as core from '@actions/core'
import * as github from '@actions/github'
import {Config, getConfig, Governance} from './config'
import ignore from './ignore'
import command from './command'
import operations from './operations'
import {initClient} from './github'

export async function getGovernance(): Promise<Governance | undefined> {
  const configPath = core.getInput('config-path', {required: true})
  const config: Config = await getConfig(initClient(), configPath)

  if (github.context.payload.issue) {
    return config.issue
  }

  if (github.context.payload.pull_request) {
    return config.pull_request
  }

  throw new Error('Could not get pull_request or issue from context')
}

/* eslint github/no-then: off */
ignore()
  .then(async toIgnore => {
    core.info('toIgnore before')
    if (toIgnore) return
    core.info('toIgnore after')

    const governance = await getGovernance()
    if (!governance) {
      core.info('no governance')
      return
    }

    core.info('has governance')
    await operations(governance, await command())
  })
  .then(() => {
    core.info('oss-governance: completed')
  })
  .catch(error => {
    core.error(error)
    core.setFailed(error.message)
  })
