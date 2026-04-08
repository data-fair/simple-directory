/**
 * ldapjs v3's DN.toString() hex-escapes all non-ASCII UTF-8 characters
 * (e.g., é → \c3\a9) per RFC 4514. However, ber.writeString() in the
 * bind request sends these as literal backslash-hex text, not as the
 * actual UTF-8 bytes. This causes DN mismatches with LDAP servers.
 *
 * This function decodes hex-escaped sequences back to UTF-8 characters,
 * then re-escapes only the DN-special ASCII characters.
 */
export function unescapeNonAsciiInDn (dnStr: string): string {
  return dnStr.replace(/((?:\\[0-9a-fA-F]{2})+)/g, (match) => {
    const hex = match.replace(/\\/g, '')
    const decoded = Buffer.from(hex, 'hex').toString('utf8')
    return decoded.replace(/[,+"\\<>;]/g, c => '\\' + c)
  })
}
