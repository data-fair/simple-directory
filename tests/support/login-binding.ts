// the Cookie header value that forwards the sd_login_* binding cookies set by a login response
export const loginBindingCookie = (res: { headers: any }): string => {
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  return setCookies.filter(c => c.startsWith('sd_login_')).map(c => c.split(';')[0]).join('; ')
}
