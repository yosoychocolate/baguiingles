import { createServer } from 'node:http'
import { handleApi } from './chat.ts'

const port = Number(process.env.PORT || 8787)

createServer((req, res) => {
  void handleApi(req, res)
}).listen(port, '0.0.0.0', () => {
  console.log(`Maya API ouvindo na porta ${port}`)
})
