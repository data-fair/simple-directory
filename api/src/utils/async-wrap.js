// small route wrapper for better use of async/await with express
export default  route => {
  return (req, res, next) => route(req, res, next).catch(next)
}
