import {blueBright, bold} from 'chalk'
import {ListQuestion, prompt, QuestionCollection, Separator} from 'inquirer'
import {
  AWS_ACCESS_KEY_ID_ENV_VAR,
  AWS_ACCESS_KEY_ID_REG_EXP,
  AWS_DEFAULT_REGION_ENV_VAR,
  AWS_REGIONS,
  AWS_SECRET_ACCESS_KEY_ENV_VAR,
  AWS_SECRET_ACCESS_KEY_REG_EXP,
  CI_API_KEY_ENV_VAR,
  CI_API_KEY_SECRET_ARN_ENV_VAR,
  CI_KMS_API_KEY_ENV_VAR,
  CI_SITE_ENV_VAR,
  DATADOG_API_KEY_REG_EXP,
  SITES,
} from './constants'
import {sentenceMatchesRegEx} from './functions/commons'

const awsCredentialsQuestions: QuestionCollection = [
  {
    // AWS_ACCESS_KEY_ID question
    message: 'Enter AWS Access Key ID:',
    name: AWS_ACCESS_KEY_ID_ENV_VAR,
    type: 'input',
    validate: (value) => {
      if (!value || !sentenceMatchesRegEx(value, AWS_ACCESS_KEY_ID_REG_EXP)) {
        return 'Enter a valid AWS Access Key ID.'
      }

      return true
    },
  },
  {
    // AWS_SCRET_ACCESS_KEY_ENV_VAR question
    mask: true,
    message: 'Enter AWS Secret Access Key:',
    name: AWS_SECRET_ACCESS_KEY_ENV_VAR,
    type: 'password',
    validate: (value) => {
      if (!value || !sentenceMatchesRegEx(value, AWS_SECRET_ACCESS_KEY_REG_EXP)) {
        return 'Enter a valid AWS Secret Access Key.'
      }

      return true
    },
  },
  {
    // AWS_DEFAULT_REGION
    choices: AWS_REGIONS,
    default: 0,
    message: 'Select an AWS region:',
    name: AWS_DEFAULT_REGION_ENV_VAR,
    type: 'list',
  },
]

const datadogApiKeyTypeQuestion = (datadogSite: string): ListQuestion => ({
  choices: [
    {
      name: `Plain text ${bold('API Key')} (Recommended for trial users) `,
      value: {
        envVar: CI_API_KEY_ENV_VAR,
        message: 'API Key:',
      },
    },
    new Separator(),
    {
      name: `AWS Key Management Service ${bold('(KMS) API Key')}`,
      value: {
        envVar: CI_KMS_API_KEY_ENV_VAR,
        message: 'KMS API Key:',
      },
    },
    {
      name: `AWS Secrets Manager ${bold('API Key Secret ARN')}`,
      value: {
        envVar: CI_API_KEY_SECRET_ARN_ENV_VAR,
        message: 'API Key Secret ARN:',
      },
    },
  ],
  message: `Which type of Datadog API Key you want to set? \nLearn more at ${blueBright(
    'https://app.${datadogSite}/organization-settings/api-keys'
  )}`,
  name: 'type',
  type: 'list',
})

const datadogSiteQuestion: QuestionCollection = {
  // DATADOG SITE
  choices: SITES,
  message: `Select the Datadog site to send data. \nLearn more at ${blueBright(
    'https://docs.datadoghq.com/getting_started/site/'
  )}`,
  name: CI_SITE_ENV_VAR,
  type: 'list',
}

const datadogEnvVarsQuestions = (datadogApiKeyType: Record<string, any>): QuestionCollection => [
  {
    // DATADOG API KEY given type
    default: process.env[datadogApiKeyType.envVar],
    message: datadogApiKeyType.message,
    name: datadogApiKeyType.envVar,
    type: 'input',
    validate: (value) => {
      if (!value || !sentenceMatchesRegEx(value, DATADOG_API_KEY_REG_EXP)) {
        return 'Enter a valid Datadog API Key.'
      }

      return true
    },
  },
]

const confirmationQuestion = (message: string): QuestionCollection => ({
  message,
  name: 'confirm',
  type: 'input',
  validate: (value) => {
    if (!value || (value.toLowerCase() !== 'y' && value.toLowerCase() !== 'n')) {
      return 'Enter either `y`|`n`'
    }

    return true
  },
})

export const requestAWSCredentials = async () => {
  try {
    const awsCredentialsAnswers = await prompt(awsCredentialsQuestions)
    process.env[AWS_ACCESS_KEY_ID_ENV_VAR] = awsCredentialsAnswers[AWS_ACCESS_KEY_ID_ENV_VAR]
    process.env[AWS_SECRET_ACCESS_KEY_ENV_VAR] = awsCredentialsAnswers[AWS_SECRET_ACCESS_KEY_ENV_VAR]
  } catch (e) {
    if (e instanceof Error) {
      throw Error(`Couldn't set AWS Credentials. ${e}`)
    }
  }
}

export const requestDatadogEnvVars = async () => {
  try {
    const datadogSiteAnswer = await prompt(datadogSiteQuestion)
    const selectedDatadogSite = datadogSiteAnswer[CI_SITE_ENV_VAR]
    process.env[CI_SITE_ENV_VAR] = selectedDatadogSite

    const datadogApiKeyTypeAnswer = await prompt(datadogApiKeyTypeQuestion(selectedDatadogSite))
    const datadogApiKeyType = datadogApiKeyTypeAnswer.type
    const datadogEnvVars = await prompt(datadogEnvVarsQuestions(datadogApiKeyType))
    const selectedDatadogApiKeyEnvVar = datadogApiKeyType.envVar
    process.env[selectedDatadogApiKeyEnvVar] = datadogEnvVars[selectedDatadogApiKeyEnvVar]
  } catch (e) {
    if (e instanceof Error) {
      throw Error(`Couldn't set Datadog Environment Variables. ${e}`)
    }
  }
}

export const requestChangesConfirmation = async (message: string) => {
  try {
    const confirmationAnswer = await prompt(confirmationQuestion(message))

    return confirmationAnswer.confirm === 'y'
  } catch (e) {
    if (e instanceof Error) {
      throw Error(`Couldn't receive confirmation. ${e}`)
    }
  }
}
