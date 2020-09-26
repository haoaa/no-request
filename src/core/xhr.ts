import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'
import { isURLSameOrigin } from '../helpers/url'
import cookie from '../helpers/cookie'
import { isFormData } from '../helpers/utils'

function xhr(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const {
      data = null,
      url,
      method = 'get',
      headers,
      responseType,
      timeout,
      cancelToken,
      withCredentials,
      xsrfCookieName,
      xsrfHeaderName,
      onDownloadProgress,
      onUploadProgress,
      auth,
      validateStatus
    } = config

    const request = new XMLHttpRequest()

    request.open(method.toUpperCase(), url!, true)

    configureRequest()

    addEvents()

    processHeaders()

    processCancel()

    request.send(data)

    function configureRequest(): void {
      if (responseType) {
        request.responseType = responseType
      }
      if (timeout) {
        request.timeout = timeout
      }

      if (withCredentials) {
        request.withCredentials = withCredentials
      }
    }

    function addEvents(): void {
      request.onreadystatechange = function handler() {
        if (request.readyState !== 4) {
          return
        }

        if (request.status === 0) {
          return
        }
        const responseHeaders = parseHeaders(request.getAllResponseHeaders())
        const responseData = responseType !== 'text' ? request.response : request.responseText
        const response: AxiosResponse = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request
        }
        handleResponce(response)
      }

      request.onerror = function handleError() {
        reject(createError('Network Error', config, null, request))
      }

      request.ontimeout = function handleError() {
        reject(
          createError(`Timeout of ${config.timeout} ms exceeded`, config, 'ECONNABORTED', request)
        )
      }

      // request.onabort = function handleError() {
      //   reject(new Error(`timeout`))
      // }
      if (onDownloadProgress) {
        request.onprogress = onDownloadProgress
      }
      if (onUploadProgress) {
        request.upload.onprogress = onUploadProgress
      }
    }

    function processHeaders(): void {
      if (isFormData(data)) {
        delete headers['Content-Type']
      }

      if ((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName) {
        const x = cookie.read(xsrfCookieName)
        if (x && xsrfHeaderName) {
          headers[xsrfHeaderName] = x
        }
      }

      // if (auth) {
      //   headers['Authorization'] = 'Basic ' + btoa(auth.username + ':' + auth.password)
      // }

      Object.keys(headers).forEach(name => {
        if (data === null && name.toLocaleLowerCase() === 'content-type') {
          delete headers[name]
        } else {
          request.setRequestHeader(name, headers[name])
        }
      })
    }

    function processCancel(): void {
      if (cancelToken) {
        cancelToken.promise.then(
          reason => {
            request.abort()
            reject(reason)
          },
          _ => _
        )
      }
    }

    function handleResponce(response: AxiosResponse): void {
      if (response.status >= 200 && response.status < 300) {
        resolve(response)
      } else {
        createError(
          `Request failed with status code ${response.status}`,
          config,
          null,
          request,
          response
        )
      }
    }
  })
}

export default xhr
