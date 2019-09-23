import { RequestPromise } from 'request-promise-native';

export interface User {
  email: string;
  handle: string;
  id: number;
  name: string;
}

export interface Config {
  startUrl: string;
}

export interface TriggerResult {
  device: string;
  location: number;
  public_id: string;
  result_id: string;
}

export interface Trigger {
  results: TriggerResult[];
  triggered_check_ids: string[];
}

export interface TriggerConfig {
  config?: Config;
  id: string;
}

export interface Test {
  config: {
    assertions: any[];
    request: {
      headers: any;
      method: string;
      timeout: number;
      url: string;
    };
    variables: string[];
  };
  created_at: string;
  created_by: User;
  locations: string[];
  message: string;
  modified_at: string;
  modified_by: User;
  monitor_id: number;
  name: string;
  options: {
    device_ids: string[];
    min_failure_duration: number;
    min_location_failed: number;
    tick_every: number;
  };
  overall_state: number;
  overall_state_modified: string;
  public_id: string;
  status: string;
  stepCount: number;
  tags: string[];
  type: string;
}

export interface TestComposite extends Test {
  results: PollResult[];
  triggerResults: TriggerResult[];
}

export interface Timings {
  dns: number;
  download: number;
  firstByte: number;
  ssl: number;
  tcp: number;
  total: number;
}

export interface Result {
  browserType: string;
  browserVersion: string;
  device: {
    height: number;
    id: string;
    isMobile: boolean;
    name: string;
    width: number;
  };
  duration: number;
  errorCode?: string;
  errorMessage?: string;
  eventType: string;
  mainDC: string;
  passed: boolean;
  receivedEmailCount: number;
  startUrl: string;
  stepDetails: Step[];
  thumbnailsBucketKey: boolean;
  timeToInteractive: number;
  timings?: Timings;
  unhealthy?: boolean;
}

export interface PollResult {
  check_id: number;
  dc_id: number;
  orgID: string;
  result: Result;
  resultID: string;
  timestamp: number;
}

export interface Resource {
  duration: number;
  size: number;
  type: string;
  url: string;
}

export interface Step {
  apmTraceIds: string[];
  browserErrors: string[];
  description: string;
  duration: number;
  error?: string;
  resource: Resource;
  screenshotBucketKey: boolean;
  skipped: boolean;
  snapshotBucketKey: boolean;
  stepId: number;
  type: string;
  url: string;
  value: string;
}

export interface Suite {
  tests: [{
    id: string;
    params: {
      startUrl: string;
    };
  }];
}

export type GetTest = (testId: string) => RequestPromise<Test>;
export type PollResults = (resultIds: string[]) => RequestPromise<{ results: PollResult[] }>;
export type TriggerTests = (testIds: string[], config?: Config) => RequestPromise<Trigger>;

export interface APIHelper {
  getTest: GetTest;
  pollResults: PollResults;
  triggerTests: TriggerTests;
}

export type APIConstructor = (args: { apiKey: string; appKey: string; baseUrl: string}) => APIHelper;