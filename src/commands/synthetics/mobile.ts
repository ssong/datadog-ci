import * as crypto from 'crypto'
import {promises as fs} from 'fs'

import {APIHelper} from './api'
import {Test, TestPayload, UserConfigOverride} from './interfaces'

export const getMD5HashFromFileBuffer = async (fileBuffer: Buffer): Promise<string> => {
  const hash = crypto.createHash('md5').update(fileBuffer).digest('base64')

  return hash
}

export const uploadMobileApplications = async (
  api: APIHelper,
  applicationPathToUpload: string,
  mobileApplicationId: string
): Promise<string> => {
  const fileBuffer = await fs.readFile(applicationPathToUpload)
  const md5 = await getMD5HashFromFileBuffer(fileBuffer)
  const {presigned_url_params: presignedUrl, file_name: fileName} = await api.getMobileApplicationPresignedURL(
    mobileApplicationId,
    md5
  )

  await api.uploadMobileApplication(fileBuffer, presignedUrl)

  return fileName
}

export const uploadApplication = async (
  api: APIHelper,
  applicationPathToUpload: string,
  testApplicationId: string,
  uploadedApplicationByPath: {[applicationFilePath: string]: {applicationId: string; fileName: string}[]}
) => {
  const fileName = await uploadMobileApplications(api, applicationPathToUpload, testApplicationId)
  if (!(applicationPathToUpload in uploadedApplicationByPath)) {
    uploadedApplicationByPath[applicationPathToUpload] = []
  }

  uploadedApplicationByPath[applicationPathToUpload].push({
    applicationId: testApplicationId,
    fileName,
  })
}

export const overrideMobileConfig = (
  userConfigOverride: UserConfigOverride,
  overriddenTest: TestPayload,
  test: Test,
  localApplicationOverride?: {applicationId: string; fileName: string}
) => {
  if (localApplicationOverride) {
    overriddenTest.mobileApplication = {
      applicationId: localApplicationOverride.applicationId,
      referenceId: localApplicationOverride.fileName,
      referenceType: 'temporary',
    }
  }

  if (!localApplicationOverride && userConfigOverride.mobileApplicationVersion) {
    overriddenTest.mobileApplication = {
      applicationId: test.options.mobileApplication!.applicationId,
      referenceId: userConfigOverride.mobileApplicationVersion,
      referenceType: 'version',
    }
  }
}

export const shouldUploadApplication = (
  applicationPathToUpload: string,
  testApplicationId: string,
  uploadedApplicationByPath: {[applicationFilePath: string]: {applicationId: string; fileName: string}[]}
): boolean =>
  !(applicationPathToUpload in uploadedApplicationByPath) ||
  !uploadedApplicationByPath[applicationPathToUpload].some(({applicationId}) => applicationId === testApplicationId)

export const uploadApplicationAndOverrideConfig = async (
  api: APIHelper,
  test: Test,
  userConfigOverride: UserConfigOverride,
  overriddenTestsToTrigger: TestPayload,
  uploadedApplicationByPath: {[applicationFilePath: string]: {applicationId: string; fileName: string}[]}
): Promise<void> => {
  const testApplicationId = test.options.mobileApplication!.applicationId
  if (
    userConfigOverride.mobileApplicationVersionFilePath &&
    shouldUploadApplication(
      userConfigOverride.mobileApplicationVersionFilePath,
      testApplicationId,
      uploadedApplicationByPath
    )
  ) {
    await uploadApplication(
      api,
      userConfigOverride.mobileApplicationVersionFilePath,
      testApplicationId,
      uploadedApplicationByPath
    )
  }

  const localApplicationOverride = userConfigOverride.mobileApplicationVersionFilePath
    ? uploadedApplicationByPath[userConfigOverride.mobileApplicationVersionFilePath].find(
        ({applicationId}) => applicationId === testApplicationId
      )
    : undefined

  overrideMobileConfig(userConfigOverride, overriddenTestsToTrigger, test, localApplicationOverride)
}
