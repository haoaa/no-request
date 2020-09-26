import { AxiosRequestConfig, AxiosPromise, AxiosResponse } from '../types'
import { buildURL, isAbsoluteURL, combineURL } from '../helpers/url'
import { flattenHeaders } from '../helpers/headers'
import xhr from './xhr'
import transform from './transform'

export default function dispatchRequest(config: AxiosRequestConfig): AxiosPromise {
  throwIfCancellationRequest(config)
  processConfig(config)
  return xhr(config).then((res: AxiosResponse) => {
    return transformResponceData(res)
  })
}

function processConfig(config: AxiosRequestConfig) {
  config.url = transformURL(config)
  config.data = transform(config.data, config.headers, config.transformRequest)
  config.headers = flattenHeaders(config.headers, config.method!)
}

export function transformURL(config: AxiosRequestConfig): string {
  let { url, params, paramsSerializer, baseURL } = config
  if (baseURL && !isAbsoluteURL(url!)) {
    url = combineURL(baseURL, url)
  }
  return buildURL(url!, params, paramsSerializer)
}

function transformResponceData(res: AxiosResponse): AxiosResponse {
  res.data = transform(res.data, res.headers, res.config.transformResponse)
  return res
}

function throwIfCancellationRequest(config: AxiosRequestConfig): void {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested()
  }
}
