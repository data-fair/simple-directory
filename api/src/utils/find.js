// Util functions shared accross the main find (GET on collection) endpoints

export const  pagination = (query, defaultSize = 10) => {
  let size = defaultSize
  if (query && query.size && !isNaN(parseInt(query.size))) {
    size = parseInt(query.size)
  }
  let skip = 0
  if (query && query.skip && !isNaN(parseInt(query.skip))) {
    skip = parseInt(query.skip)
  } else if (query && query.page && !isNaN(parseInt(query.page))) {
    skip = (parseInt(query.page) - 1) * size
  }
  return { skip, size }
}

export const  sort = (sortStr) => {
  const sort = {}
  if (!sortStr) return sort
  sortStr.split(',').forEach(s => {
    if (s.startsWith('-')) {
      sort[s.slice(1)] = -1
    } else {
      sort[s] = 1
    }
  })
  return sort
}
